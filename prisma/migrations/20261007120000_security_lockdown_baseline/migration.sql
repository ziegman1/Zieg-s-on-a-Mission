-- Database security baseline (Security 0B). Applied to production on 2026-10-06.
--
-- Final state:
--   * anon and authenticated hold no privileges on any of the 42 public tables.
--     The app reaches the database only server-side through Prisma (role postgres);
--     browser/client access through the Supabase Data API is not supported.
--   * Row level security is enabled on every public table. The 8 Mission Hub tables
--     already have it, with their policies, from their own migrations and are not
--     re-altered here; it is enabled on the remaining 34 with no policies, so only
--     roles that bypass RLS (postgres, service_role) can use them.
--   * Tables, sequences and functions that postgres creates in public later do not
--     auto-grant anon or authenticated. New tables still need their own
--     ENABLE ROW LEVEL SECURITY in the migration that creates them.
--
-- Deliberately unchanged: service_role privileges, existing policies, FORCE RLS
-- (not used), the storage schema, and default privileges of other roles.
--
-- Idempotent: on a database already in this state it changes nothing and takes no
-- table locks. It aborts if the migrating role cannot bypass RLS, because enabling
-- RLS without policies would then hide every row from Prisma
-- (see 20260328160000_disable_rls_for_prisma).
--
-- Required Supabase platform settings that are not SQL (Data API disabled, Auth
-- signup disabled) are documented in docs/go-live-checklist.md.

DO $$
DECLARE
  locked_tables constant text[] := ARRAY[
    -- Commerce and NextAuth
    'Account', 'Session', 'VerificationToken', 'Collection', 'Product',
    'ProductCollection', 'ProductImage', 'ProductVariant', 'Inventory',
    'ExternalProductMapping', 'Provider', 'ProviderSetting', 'ShippingRate',
    'DefaultFulfillmentAddress', 'PendingCheckoutCart', 'Order', 'OrderItem',
    'Fulfillment', 'FulfillmentItem', 'Shipment',
    -- Site, admin, newsletters, campaigns, analytics
    'User', 'recruits', 'SiteCopy', 'site_page_sections', 'blog_posts', 'newsletters',
    'newsletter_brand_settings', 'PageView', 'email_suppressions',
    'notification_preference_events', 'community_hub_activity_events',
    'support_campaigns', 'support_campaign_pledge_intents', '_prisma_migrations',
    -- Mission Hub (RLS and policies come from their own migrations)
    'community_hub_settings', 'community_members', 'community_notifications',
    'community_post_comments', 'community_post_reactions', 'community_posts',
    'community_spaces', 'mission_hub_email_deliveries'
  ];
  mission_hub_tables constant text[] := ARRAY[
    'community_hub_settings', 'community_members', 'community_notifications',
    'community_post_comments', 'community_post_reactions', 'community_posts',
    'community_spaces', 'mission_hub_email_deliveries'
  ];
  t text;
  problems text;
BEGIN
  PERFORM set_config('lock_timeout', '5s', true);

  IF NOT EXISTS (
    SELECT 1 FROM pg_roles r WHERE r.rolname = current_user AND (r.rolsuper OR r.rolbypassrls)
  ) THEN
    RAISE EXCEPTION 'Security baseline aborted: role % cannot bypass row level security', current_user;
  END IF;

  SELECT string_agg(u.tn, ', ') INTO problems
    FROM unnest(locked_tables) AS u(tn)
    WHERE to_regclass(format('public.%I', u.tn)) IS NULL;
  IF problems IS NOT NULL THEN
    RAISE EXCEPTION 'Security baseline aborted: expected public tables are missing: %', problems;
  END IF;

  FOREACH t IN ARRAY locked_tables LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
  END LOOP;

  FOREACH t IN ARRAY locked_tables LOOP
    IF t <> ALL (mission_hub_tables) AND NOT (
      SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = format('public.%I', t)::regclass
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;

  ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
  ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
  ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

  SELECT string_agg(format('%s/%s', u.tn, g.rolname), ', ') INTO problems
    FROM unnest(locked_tables) AS u(tn)
    CROSS JOIN (VALUES ('anon'), ('authenticated')) AS g(rolname)
    WHERE has_table_privilege(g.rolname, format('public.%I', u.tn),
                              'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER');
  IF problems IS NOT NULL THEN
    RAISE EXCEPTION 'Security baseline verification failed: still privileged: %', problems;
  END IF;

  SELECT string_agg(u.tn, ', ') INTO problems
    FROM unnest(locked_tables) AS u(tn)
    JOIN pg_class c ON c.oid = format('public.%I', u.tn)::regclass
    WHERE NOT c.relrowsecurity;
  IF problems IS NOT NULL THEN
    RAISE EXCEPTION 'Security baseline verification failed: RLS not enabled on: %', problems;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d, aclexplode(d.defaclacl) AS a
    WHERE d.defaclrole = 'postgres'::regrole
      AND d.defaclnamespace = 'public'::regnamespace
      AND a.grantee IN ('anon'::regrole, 'authenticated'::regrole)
  ) THEN
    RAISE EXCEPTION 'Security baseline verification failed: postgres default privileges in public still grant anon/authenticated';
  END IF;
END
$$;

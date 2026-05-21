-- Mission Hub unified settings (member profile, hub branding, space config)

ALTER TABLE "community_members" ADD COLUMN IF NOT EXISTS "display_name" TEXT;
ALTER TABLE "community_members" ADD COLUMN IF NOT EXISTS "bio" TEXT;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "community_notification_prefs" JSONB;

ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "cover_image_url" TEXT;
ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "community_spaces" ADD COLUMN IF NOT EXISTS "settings" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS "community_hub_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "title" TEXT,
    "tagline" TEXT,
    "logo_url" TEXT,
    "cover_image_url" TEXT,
    "welcome_text" TEXT,
    "invitation_title" TEXT,
    "invitation_body" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_hub_settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "community_hub_settings" ("id")
VALUES ('default')
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "community_hub_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_hub_settings_server_manage"
ON "community_hub_settings"
FOR ALL
USING (current_user LIKE 'postgres%')
WITH CHECK (current_user LIKE 'postgres%');

CREATE POLICY "community_hub_settings_service_role_manage"
ON "community_hub_settings"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

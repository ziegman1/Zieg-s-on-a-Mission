-- Newsletter Builder: newsletter-assets bucket (run manually in Supabase SQL Editor)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'newsletter-assets',
  'newsletter-assets',
  true,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "newsletter_assets_public_read" ON storage.objects;

CREATE POLICY "newsletter_assets_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'newsletter-assets');

-- Writes use SUPABASE_SERVICE_ROLE_KEY on the server (admin API only).

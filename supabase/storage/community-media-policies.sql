-- Mission Hub: community-media bucket (run manually in Supabase SQL Editor — not a Prisma migration)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-media',
  'community-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "community_media_public_read" ON storage.objects;

CREATE POLICY "community_media_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'community-media');

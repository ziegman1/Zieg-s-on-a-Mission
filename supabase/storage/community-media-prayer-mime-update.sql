-- Mission Hub: allow prayer audio + video in community-media bucket
-- Run in Supabase SQL Editor after community-media bucket exists.

UPDATE storage.buckets
SET
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/mpeg',
    'audio/mp4',
    'audio/webm',
    'audio/ogg',
    'audio/wav',
    'audio/x-m4a',
    'audio/m4a',
    'audio/aac',
    'video/mp4',
    'video/webm'
  ]::text[]
WHERE id = 'community-media';

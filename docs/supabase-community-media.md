# Supabase Storage — Mission Hub `community-media`

Post cover images upload to Supabase Storage (not Vercel Blob). The app stores the public HTTPS URL in `community_posts.cover_image_url`.

## 1. Create the bucket (Dashboard)

1. Supabase project → **Storage** → **New bucket**
2. **Name:** `community-media`
3. **Public bucket:** **On** (so published posts can show images without signed URLs)
4. Create

## 2. Storage policies (SQL Editor)

Run in **SQL Editor** if you prefer policies over dashboard-only setup. Public read; writes only via **service role** on the server (no direct browser upload to Storage).

```sql
-- Ensure bucket exists (public read for storefront)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'community-media',
  'community-media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Anyone can view objects in this bucket (published Mission Hub feed)
CREATE POLICY "community_media_public_read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'community-media');

-- Do not grant INSERT to anon/authenticated — uploads go through Next.js API + service role.
```

If policy `community_media_public_read` already exists, skip or drop/recreate.

**Note:** The Next.js API uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS for uploads. Do not expose that key to the client.

## 3. Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local`, Vercel | Project URL, e.g. `https://YOUR_REF.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local`, Vercel **server only** | Legacy **service_role JWT** for server uploads (see below) |

Optional server alias: `SUPABASE_URL` (same as public URL) if you omit `NEXT_PUBLIC_SUPABASE_URL` on the server.

**Do not** commit the service role key. Add to Vercel **Production** (and Preview if needed).

### Which API key to use

Mission Hub uploads use `@supabase/supabase-js` on the server. That client sends your key as `Authorization: Bearer …`, which Supabase validates as a **JWT**.

| Key type | Format | Use for `SUPABASE_SERVICE_ROLE_KEY`? |
|----------|--------|--------------------------------------|
| New secret key | `sb_secret_…` | **No** — causes `Invalid Compact JWS` (not a JWT) |
| New publishable key | `sb_publishable_…` | **No** |
| Legacy service_role | `eyJ…` (three dot-separated parts) | **Yes** |

Copy the legacy key from **Dashboard → Settings → API Keys → Legacy API Keys → service_role** (not the default “Secret keys” `sb_secret_…` row).

Supabase’s newer `sb_secret_…` keys are valid for some backends but are **not** compatible with this app’s Storage client until `supabase-js` supports them without JWT Bearer auth.

## 4. Upload path layout

```
community-media/
  posts/
    YYYY/
      MM/
        <uuid>.jpg|png|webp
  profiles/
    YYYY/
      MM/
        <uuid>.jpg|png|webp
```

Member profile photos use `profiles/…` via `POST /api/community/upload-profile` (visitor cookie; not owner uploads).

## 5. App endpoints

- **POST** `/api/community/upload-cover` — owner/admin session only (`requireCommunityOwner`)
- Validates JPG, PNG, WebP; max **5 MB**
- Returns `{ url, path }` — composer sets `cover_image_url` to `url`

Product/site-copy uploads still use **Vercel Blob** (`/api/admin/upload`) unless migrated separately.

## 6. Test locally

1. Create bucket + policies in Supabase.
2. Add env vars to `.env.local` (save the file — placeholders like `REPLACE_WITH_SUPABASE_SERVICE_ROLE_KEY` will fail validation).
3. Start with **`npm run dev`** (loads `.env.local` via dotenv). After any `.env.local` change, **stop and restart** the dev server; Next.js does not reload server env vars on save.
4. On upload failure, check the **terminal** running `npm run dev` for `[supabase/env-debug:upload-cover]` — it logs the first 20 characters and length of the loaded key (never the full secret).
5. Sign in as admin → `/community` → **Create** → **Create post**.
4. **Add cover photo** → choose image → wait for preview → **Share post**.
5. Confirm image loads on the feed card (public URL).

## 7. Test production

1. Set the same env vars on Vercel; redeploy (build does not configure Storage).
2. Repeat upload flow on live `/community`.
3. Open feed in a logged-out browser to confirm public read works.

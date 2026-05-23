# Supabase Storage — Newsletter Builder `newsletter-assets`

Newsletter Builder image uploads (branding header/footer, featured image, image blocks) use Supabase Storage. The app stores public HTTPS URLs in the database and renders them on admin preview and public `/newsletters/[slug]` pages.

## 1. Create the bucket (Dashboard)

1. Supabase project → **Storage** → **New bucket**
2. **Name:** `newsletter-assets`
3. **Public bucket:** **On**
4. Create

Or run `supabase/storage/newsletter-assets-policies.sql` in the **SQL Editor** (creates bucket + public read policy).

## 2. Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local`, Vercel | Project URL, e.g. `https://YOUR_REF.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local`, Vercel **server only** | Legacy **service_role JWT** (`eyJ…`) for server uploads |

Same keys as Mission Hub `community-media` — one Supabase project, two buckets.

**Do not** use `sb_secret_…` keys; they cause JWT errors with `@supabase/supabase-js`. Use **Legacy API Keys → service_role**.

Optional: `SUPABASE_URL` (server alias for project URL).

Vercel Blob (`BLOB_READ_WRITE_TOKEN`) is **not** used for newsletter images.

## 3. Upload path layout

```
newsletter-assets/
  branding/
    header/{uuid}.jpg
    footer/{uuid}.jpg
  newsletters/{newsletterId}/
    featured/{uuid}.jpg
    header/{uuid}.jpg
    footer/{uuid}.jpg
    blocks/{uuid}.jpg
  temp/
    featured|block|header|footer/{uuid}.jpg   # before first save (no id yet)
```

## 4. App endpoint

- **POST** `/api/admin/upload-newsletter-image` — `ADMIN` / `STAFF` session only
- Form fields: `file`, `purpose` (`header` | `featured` | `footer` | `block`), optional `newsletterId`
- Validates JPG, PNG, WebP; max **5 MB**
- Returns `{ url, path, storage: "supabase" }`

## 5. Test locally

1. Create `newsletter-assets` bucket + policies.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
3. Restart `npm run dev` after env changes.
4. Admin → Site Builder → Newsletters → **Branding** → upload header/footer.
5. Edit a newsletter → upload featured image and an image block → save draft → reload.
6. Publish and open `/newsletters/{slug}` logged out — images should load.

On failure, check the dev server terminal for `[supabase/env-debug:upload-newsletter-image]`.

## 6. Test production

1. Set the same env vars on Vercel; redeploy.
2. Repeat upload + publish flow on production.
3. Confirm public newsletter pages load images (public bucket read).

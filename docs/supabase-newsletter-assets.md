# Supabase Storage — Newsletter Builder `newsletter-assets`

Newsletter Builder image uploads (branding header/footer, featured image, image blocks) use **Supabase Storage** on the server. The browser never talks to Supabase directly — admins upload via `POST /api/admin/upload-newsletter-image` (NextAuth session + `SUPABASE_SERVICE_ROLE_KEY`).

Mission Hub post covers use the same Supabase project and env vars but the **`community-media`** bucket. See [supabase-community-media.md](./supabase-community-media.md).

## Environment variables

| Variable | Required for uploads | Where | Purpose |
|----------|---------------------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | `.env.local`, Vercel Production + Preview | Project URL, e.g. `https://YOUR_REF.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | `.env.local`, Vercel **server only** | Legacy **service_role JWT** (`eyJ…`) — server uploads |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No (uploads) | Optional | Public anon JWT — future browser client; same as Dashboard → anon key |

Server alias: `SUPABASE_URL` (same value as `NEXT_PUBLIC_SUPABASE_URL`) if you prefer not to duplicate the URL on the server.

**Do not** use `sb_secret_…` for `SUPABASE_SERVICE_ROLE_KEY`; `@supabase/supabase-js` sends it as a Bearer JWT and Supabase returns `Invalid Compact JWS`. Use **Dashboard → Settings → API Keys → Legacy API Keys → service_role**.

Vercel Blob (`BLOB_READ_WRITE_TOKEN`) is **not** used for newsletter images.

### Validate local env

```bash
npm run validate:supabase-storage
```

Exits 0 when `NEXT_PUBLIC_SUPABASE_URL` and a valid `SUPABASE_SERVICE_ROLE_KEY` are in `.env.local`.

### Error messages

When configuration is incomplete, the API returns:

- `Supabase Storage is not configured. Missing NEXT_PUBLIC_SUPABASE_URL.`
- `Supabase Storage is not configured. Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.`

In development, responses may also append: `Add values to .env.local and restart npm run dev.`

## 1. Create the bucket

**Dashboard:** Storage → New bucket → Name `newsletter-assets` → **Public** → Create.

**SQL:** Run `supabase/storage/newsletter-assets-policies.sql` in the SQL Editor (creates bucket + public read policy).

Uploads use the **service role** on the server (bypasses RLS). Public visitors read objects via the public bucket policy.

## 2. Path layout

```
newsletter-assets/
  branding/
    header/{uuid}.jpg
    footer/{uuid}.jpg
  newsletters/{newsletterId}/
    featured|header|footer|blocks/{uuid}.jpg
  temp/
    {purpose}/{uuid}.jpg    # drafts before first save
```

## 3. App architecture

| Layer | Implementation |
|-------|----------------|
| Client | `uploadNewsletterImageFile()` → `fetch("/api/admin/upload-newsletter-image")` |
| API | `src/app/api/admin/upload-newsletter-image/route.ts` — ADMIN/STAFF only |
| Storage | `src/lib/supabase/newsletter-media.ts` → shared `getSupabaseStorageAdmin()` |
| Config | `src/lib/supabase/config.ts` — `getSupabaseStorageConfigProblems()`, `supabaseStorageNotConfiguredMessage()` |

No duplicate Supabase clients — one singleton in `src/lib/supabase/storage-admin.ts`.

## 4. Local setup

1. Copy keys from Supabase Dashboard → Settings → API Keys → **Legacy API Keys**:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
   - `anon` `public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (optional for uploads)
2. Add to `.env.local` (never commit).
3. Create `newsletter-assets` bucket (above).
4. Run `npm run validate:supabase-storage`.
5. Start with **`npm run dev`** (loads `.env.local` via dotenv). After any `.env.local` edit, **stop and restart** the dev server.
6. Admin → Site Builder → Newsletters → upload branding header/footer and block images.

On failure, check the terminal for `[supabase/env-debug:upload-newsletter-image]`.

## 5. Vercel / production setup

Production **must** define the same Storage vars. As of the newsletter upload fix, many Vercel projects only had `DATABASE_URL` / `DIRECT_URL` / `AUTH_SECRET` — uploads then fail with missing `NEXT_PUBLIC_SUPABASE_URL`.

1. **Vercel** → Project → **Settings** → **Environment Variables**
2. Add for **Production** and **Preview**:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_REF.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Legacy service_role JWT (`eyJ…`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Legacy anon JWT (optional for uploads) |

3. **Redeploy** after saving env vars (Vercel injects env at deploy time).
4. Confirm `newsletter-assets` bucket exists on the **same** Supabase project as `DATABASE_URL`.
5. Smoke test: production admin → Newsletters → upload image → save → public `/newsletters/{slug}`.

CLI (from repo root, with `.env.local` populated):

```bash
npx dotenv -e .env.local -- bash -c 'printf "%s" "$NEXT_PUBLIC_SUPABASE_URL" | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production'
npx dotenv -e .env.local -- bash -c 'printf "%s" "$SUPABASE_SERVICE_ROLE_KEY" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production'
```

Repeat for `preview` if you use preview deployments.

See also [vercel-deployment-checklist.md](./vercel-deployment-checklist.md).

## 6. API reference

- **POST** `/api/admin/upload-newsletter-image`
- Form: `file`, `purpose` (`header` | `featured` | `footer` | `block`), optional `newsletterId`
- JPG, PNG, WebP; max **5 MB**
- Response: `{ url, path, storage: "supabase" }`

# Vercel deployment checklist — Zieg’s on a Mission Merch

**Project:** Zieg’s on a Mission Merch (or your Vercel project name)  
**GitHub repo:** Your connected repository (this codebase)

Use this while importing the repo into Vercel and doing the first production deploy.

---

## 1. Exact Vercel environment variables to add

Add these in **Vercel → Project → Settings → Environment Variables**. Set each for **Production** (and **Preview** if you want preview deployments to work).

| Variable | What to use |
|----------|-------------|
| **DATABASE_URL** | Your Supabase **transaction pooler** connection string (port 6543), with `?pgbouncer=true` at the end. Copy from Supabase Dashboard → Project Settings → Database → Connection string → **Transaction** (pooler). Replace `[YOUR-PASSWORD]` with your DB password; URL-encode special characters in the password. |
| **DIRECT_URL** | Your Supabase **session pooler** connection string (port 5432), same pooler host as above. Copy from Supabase → Connection string → **Session** (pooler). Use this format so migrations work from IPv4; avoid relying on `db.xxx.supabase.co` from Vercel if it fails. |
| **AUTH_SECRET** | A new random secret for production only. Generate with: `openssl rand -base64 32`. Do not reuse your local `.env.local` value. |
| **NEXTAUTH_URL** | Your live app URL. After custom domain setup use **`https://ziegsonamission.com`**. For the first deploy before DNS, use your Vercel URL, e.g. **`https://<your-project>.vercel.app`** (no trailing slash). |
| **STRIPE_SECRET_KEY** | Stripe **live** secret key (`sk_live_...`) from Dashboard → Developers → API keys. Use test keys on Preview if you prefer. |
| **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** | Stripe **live** publishable key (`pk_live_...`) from the same place. |
| **PRINTIFY_API_KEY** | Printify API key. |
| **PRINTIFY_SHOP_ID** | Printify Shop ID. |

---

## 2. Correct values / format

- **DATABASE_URL** — Transaction pooler, port **6543**, include **`?pgbouncer=true`** where required for Prisma/serverless.  
- **DIRECT_URL** — Session pooler, port **5432**, same pooler host pattern as above.  
- **NEXTAUTH_URL** — Must exactly match the URL users open in the browser for that environment (production domain or `*.vercel.app`).  

---

## 3. Exact Vercel import settings

- [ ] **Framework Preset:** Next.js  
- [ ] **Root Directory:** repo root (or `.`)  
- [ ] **Build Command:** default (repo uses `npm run build` → `scripts/build.ts`)  
- [ ] **Output Directory:** default  

---

## 4. What not to do

- **Do not** set `NEXTAUTH_URL` to `http://localhost:3000` in Vercel.  
- **Do not** commit `.env` or `.env.local`.  
- **Do not** deploy production without `DATABASE_URL` and `DIRECT_URL` valid for your host.  

---

## 5. What to click in order in Vercel

1. **Import repo** — Add New → Project → import your Git repository.  
2. **Review settings** — Framework Next.js, root directory correct.  
3. **Add env vars** — Add variables from section 1 for Production (and Preview if needed).  
4. **Deploy** — Run the first deployment and confirm the build succeeds.  

---

## 6. What to test immediately after deploy

- [ ] **Homepage** — Storefront loads at your production or `*.vercel.app` URL.  
- [ ] **Shop** — `/shop` loads.  
- [ ] **Product** — A product detail page loads.  
- [ ] **Admin** — `/admin/login` → sign in.  
- [ ] **Database** — No 500s on DB-backed routes; check logs if anything fails.  

---

*No secrets in this doc. Keep sensitive values in Vercel Environment Variables and local `.env.local` only.*

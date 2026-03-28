# Zieg’s on a Mission Merch

Ministry-focused site for **Zieg’s on a Mission** (serving with **Team Expansion**), with an optional **Zieg’s on a Mission Merch** storefront: home, mission content, blog, contact, and a full shop when enabled. Admin tools cover products, orders, Printify sync, shipping, and site copy.

## Tech stack

- **Next.js** (App Router) + TypeScript  
- **TailwindCSS** + shadcn/ui  
- **PostgreSQL** + Prisma ORM  
- **Auth.js** (NextAuth v5) for admin auth  
- **Stripe** for payments  
- **Resend** (optional) for transactional email  
- **Printify** (optional) for print-on-demand fulfillment  
- **Zod** for validation  

## Local setup

### 1. Dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and set:

```bash
cp .env.example .env.local
```

Required for local run:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `DIRECT_URL` | Direct (non-pooler) URL for migrations |
| `AUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for local |
| `NEXT_PUBLIC_SITE_URL` | Same as `NEXTAUTH_URL` in local dev (optional) |
| `STRIPE_SECRET_KEY` | Stripe test key (`sk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe test publishable key (`pk_test_...`) |

Optional (for full flows):

- `STRIPE_WEBHOOK_SECRET` — webhooks (`stripe listen` locally; Dashboard in production)  
- `RESEND_API_KEY`, `EMAIL_FROM` — order emails (`EMAIL_FROM` overrides `src/data/legal-config.ts` when set)  
- `PRINTIFY_API_KEY`, `PRINTIFY_SHOP_ID` — Printify catalog + fulfillment  

Production base URL: **`https://ziegsonamission.com`** (set `NEXTAUTH_URL` and metadata accordingly).

**Env hygiene:** Keep only `.env.local` (and optional `.env.example` as reference) in the repo root for secrets. Retired env files belong in **`.env-archive/`** (gitignored); never commit real keys. If an old environment overlapped another project, **rotate** database, Stripe, Printify, Resend, and `AUTH_SECRET` for Zieg’s-only credentials.

### 3. Database

```bash
npm run db:migrate
npm run db:seed
```

Seed creates:

- Admin user: **jziegenhorn@teamexpansion.org** — password from **ADMIN_PASSWORD** in `.env.local` when you run `db:seed`, or the default bcrypt in `prisma/seed.ts` if unset (rotate after first deploy)  
- Printify provider  
- Featured & Apparel collections  
- Sample products (self-fulfilled + dropship placeholders)  
- Syncs manual products from `src/data/manual-products.ts` and Printify when API env vars are set  

### 4. Run dev server

```bash
npm run dev
```

- **Storefront:** http://localhost:3000  
- **Admin:** http://localhost:3000/admin  

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (`scripts/build.ts` → Prisma + `next build`) |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema (no migrations) |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run test:email` | Test Resend admin notification |
| `npm run test:order` | Order flow / Stripe helpers |

## Project layout

- `/docs` — Deployment, email, Printify, branding notes  
- `/prisma` — Schema, migrations, seed  
- `/src/app` — App Router routes  
  - `(storefront)/` — Home, shop, product, cart, checkout, legal, contact  
  - `admin/` — Dashboard, products, orders, providers, site copy, settings  
  - `api/` — Auth, checkout, webhooks, uploads  
- `/src/lib` — db, orders, fulfillment (Printify + self-fulfilled)  
- `/src/data` — `legal-config`, `shop-config`, `manual-products`, defaults for site copy  
- `/public/logo` — e.g. `team-expansion.png` for the header  

## Design

Brand tokens live in `src/app/globals.css` (`--brand-primary`, `--brand-accent`, `--brand-deep-red`, `--cream`, etc.). See `/docs/branding.md` for the palette and usage notes.

## Fulfillment

- **Dropship:** Printify-backed products use `ExternalProductMapping`; paid orders are routed in the Stripe webhook.  
- **Self-fulfilled:** In-house products get internal fulfillments; admin can track packing and shipping.  

See `/docs/implementation-plan.md` for historical scope notes.

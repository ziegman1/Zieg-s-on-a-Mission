# Mission Hub — production database setup

Production Vercel deploys **application code only**. Mission Hub spaces and posts live in **Supabase Postgres** (same project as `DATABASE_URL` on Vercel). If production shows an empty hub but local works, the production database usually needs **migrations** and **default spaces**.

## 1. Confirm Vercel points at the right Supabase project

In [Vercel](https://vercel.com) → Project → **Settings** → **Environment Variables** (Production):

| Variable | Typical Supabase value |
|----------|------------------------|
| `DATABASE_URL` | Connection pooler, port **6543**, `?pgbouncer=true` |
| `DIRECT_URL` | Session mode / direct, port **5432** (migrations) |

Both must reference the **same** Supabase project ref (hostname contains `db.<project-ref>.supabase.co` or your pooler host).

Copy values into a local file (never commit):

```bash
# .env.production — gitignored; paste from Vercel Production env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

## 2. Check migration and space state (read-only)

```bash
npm run db:check:production
```

This prints the DB host, migration status, existing spaces, and whether default slugs are missing.

## 3. Apply Prisma migrations (production)

Uses `DIRECT_URL` for migration locking. **Does not run automatically on Vercel build.**

```bash
npm run db:migrate:deploy:production
```

Or with explicit env file:

```bash
dotenv -e .env.production -- prisma migrate deploy
```

Verify:

```bash
npm run db:migrate:status:production
```

All community migrations (20260521* … 20260530*) should show as applied.

## 4. Seed default Mission Hub spaces (missing slugs only)

Safe bootstrap — **creates** rows only when the slug does not exist. **Never updates** existing production spaces or posts.

Default published spaces:

| Slug | Title |
|------|--------|
| `start-here` | Welcome / Start Here |
| `prayer-and-praise-room` | Prayer & Praise Room |
| `ministry-updates` | Ministry Updates |
| `resources` | Resources |

```bash
MISSION_HUB_SEED_CONFIRM=production npm run db:seed:mission-hub:production
```

Local dev (same logic, no confirm flag on localhost):

```bash
npm run db:seed:mission-hub
```

## 5. Admin users (optional)

Does not create spaces. Only upserts configured admin accounts:

```bash
dotenv -e .env.production -- tsx prisma/seed-admin.ts
```

Set owner passwords via env keys documented in `prisma/ensure-admin-users.ts`.

## 6. Posts and content

The space seed **does not** copy posts from your dev database. After spaces exist:

- Publish posts in **Admin → Community**, or
- Export/import content separately.

Draft spaces in production stay hidden until published (`listPublishedCommunitySpaces` filters `status = published`).

## 7. Redeploy

No redeploy is required for DB-only changes. Refresh `/community` after seeding. Redeploy only if you changed application code.

## Command reference

| Command | Purpose |
|---------|---------|
| `npm run db:check:production` | Diagnostics (migrations, spaces, posts) |
| `npm run db:migrate:deploy:production` | Apply pending migrations |
| `npm run db:migrate:status:production` | List migration state |
| `MISSION_HUB_SEED_CONFIRM=production npm run db:seed:mission-hub:production` | Insert missing default spaces |

## Running from Vercel (not recommended for seed)

Vercel build does not run migrations or seeds. For emergencies you can use **Vercel CLI** with production env pulled locally:

```bash
vercel env pull .env.production
npm run db:migrate:deploy:production
MISSION_HUB_SEED_CONFIRM=production npm run db:seed:mission-hub:production
```

Prefer running the same commands from your machine with `.env.production` so you can review output before writing.

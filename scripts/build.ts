#!/usr/bin/env node
/**
 * Production build entry (used by `npm run build` and Vercel).
 *
 * Database migrations are NOT run here — by design. Vercel and local builds only
 * ship application code. Schema changes must be applied separately so preview
 * deploys cannot alter production, and migrations stay intentional.
 *
 * Local development (create migration SQL + apply to your dev DB):
 *   npm run db:migrate
 *   → prisma migrate dev (loads .env.local)
 *
 * Production / staging (apply pending migrations only — run manually when ready):
 *   npm run db:migrate:deploy
 *   → prisma migrate deploy (loads .env.local; use production DIRECT_URL intentionally)
 *
 * This script only runs `prisma generate` (client from schema) and `next build`.
 */
import { execSync } from "child_process";

function run(cmd: string) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

run("npx prisma generate");
run("next build");

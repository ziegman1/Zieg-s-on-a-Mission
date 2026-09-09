#!/usr/bin/env node
/**
 * Fails when .env.local points at the same database as .env.production.
 *
 * `npm run dev`, `db:migrate`, `db:push`, and `db:seed` all read .env.local. If that file was
 * populated from a production `vercel env pull`, local development writes straight to production.
 *
 * Never prints credentials — only redacted host:port/db targets.
 * Usage: node scripts/check-env-separation.mjs [localFile] [productionFile]
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { cleanDbUrl, formatDbTarget, loadEnvFile } from "./supabase-db-env.mjs";

const localFile = process.argv[2] ?? ".env.local";
const productionFile = process.argv[3] ?? ".env.production";

const localPath = resolve(process.cwd(), localFile);
const productionPath = resolve(process.cwd(), productionFile);

if (!existsSync(localPath)) {
  console.error(`[check-env-separation] Missing ${localFile} — nothing to check.`);
  process.exit(1);
}

if (!existsSync(productionPath)) {
  console.log(
    `[check-env-separation] No ${productionFile} present; skipping separation check.`,
  );
  process.exit(0);
}

const local = loadEnvFile(localPath, { readFileSync }, existsSync);
const production = loadEnvFile(productionPath, { readFileSync }, existsSync);

const problems = [];

const localDb = cleanDbUrl(local.DATABASE_URL ?? "");
const productionDb = cleanDbUrl(production.DATABASE_URL ?? "");

if (!localDb) {
  problems.push(`${localFile} has no DATABASE_URL.`);
}

if (localDb && productionDb && localDb === productionDb) {
  problems.push(
    `${localFile} DATABASE_URL is identical to ${productionFile}. Local development would write to production.`,
  );
}

const localDirect = cleanDbUrl(local.DIRECT_URL ?? "");
const productionDirect = cleanDbUrl(production.DIRECT_URL ?? "");

if (localDirect && productionDirect && localDirect === productionDirect) {
  problems.push(
    `${localFile} DIRECT_URL is identical to ${productionFile}. Migrations run locally would apply to production.`,
  );
}

if (local.VERCEL_ENV === "production" || local.VERCEL_TARGET_ENV === "production") {
  problems.push(
    `${localFile} carries production environment markers (VERCEL_ENV / VERCEL_TARGET_ENV = "production").`,
  );
}

console.log(`[check-env-separation] ${localFile} DATABASE_URL host:`, formatDbTarget(localDb));
console.log(
  `[check-env-separation] ${productionFile} DATABASE_URL host:`,
  formatDbTarget(productionDb),
);

if (problems.length > 0) {
  console.error("[check-env-separation] FAILED:");
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error(
    "\n  Point .env.local at a development database before running dev, migrate, or seed commands.",
  );
  process.exit(1);
}

console.log(
  "[check-env-separation] OK — local and production databases are distinct.",
);

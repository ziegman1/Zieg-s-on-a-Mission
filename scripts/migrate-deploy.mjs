#!/usr/bin/env node
/**
 * Local-safe `prisma migrate deploy`.
 *
 * Prisma uses schema `directUrl` (DIRECT_URL) for migrations. When db.<ref>.supabase.co:5432
 * is blocked on your network, this script probes DIRECT_URL then falls back to the Supabase
 * session pooler on :5432 (derived from DATABASE_URL).
 *
 * Does not modify .env files. Set MIGRATE_ENV_FILE=.env.production for production deploys.
 */
import { spawnSync } from "child_process";
import { loadPrismaEnv, assertSupabasePrismaEnv } from "./load-prisma-env.mjs";
import { formatDbTarget } from "./supabase-db-env.mjs";
import { resolveMigrateDirectUrl } from "./resolve-migrate-url.mjs";

const envFiles = process.env.MIGRATE_ENV_FILE
  ? [process.env.MIGRATE_ENV_FILE]
  : [".env", ".env.local"];

const label = envFiles.includes(".env.production") ? "migrate-deploy:production" : "migrate-deploy";

const baseEnv = loadPrismaEnv(envFiles);
assertSupabasePrismaEnv(baseEnv, { label });

console.log(`[${label}] DATABASE_URL (app runtime):`, formatDbTarget(baseEnv.DATABASE_URL));
console.log(`[${label}] DIRECT_URL (configured):`, formatDbTarget(baseEnv.DIRECT_URL));

const { migrateDirectUrl, source } = await resolveMigrateDirectUrl(baseEnv);
console.log(`[${label}] Using for migrate:`, source);
console.log(`[${label}] Migrate target:`, formatDbTarget(migrateDirectUrl));

const migrateEnv = {
  ...process.env,
  ...baseEnv,
  DIRECT_URL: migrateDirectUrl,
};

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: migrateEnv,
});

process.exit(result.status ?? 1);

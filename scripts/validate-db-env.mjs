#!/usr/bin/env node
/**
 * Validates DATABASE_URL / DIRECT_URL roles in an env file (no DB connection).
 * Usage: node scripts/validate-db-env.mjs .env.production
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  formatDbTarget,
  validateSupabaseDbUrls,
  loadEnvFile,
} from "./supabase-db-env.mjs";

const file = process.argv[2] ?? ".env.production";
const path = resolve(process.cwd(), file);

if (!existsSync(path)) {
  console.error(`[validate-db-env] File not found: ${file}`);
  process.exit(1);
}

const env = loadEnvFile(path, { readFileSync }, existsSync);
const { ok, errors, warnings } = validateSupabaseDbUrls(
  env.DATABASE_URL,
  env.DIRECT_URL,
);

console.log(`[validate-db-env] ${file}`);
console.log("[validate-db-env] DATABASE_URL host:", formatDbTarget(env.DATABASE_URL ?? ""));
console.log("[validate-db-env] DIRECT_URL host:", formatDbTarget(env.DIRECT_URL ?? ""));

for (const w of warnings) console.warn(`[validate-db-env] Warning: ${w}`);

if (!ok) {
  console.error("[validate-db-env] Errors:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("[validate-db-env] OK — pooler :6543 on DATABASE_URL, direct :5432 on DIRECT_URL.");

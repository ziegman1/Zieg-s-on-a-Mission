#!/usr/bin/env node
/**
 * Applies fix-production-schema.sql to the database and marks migration as applied.
 * Loads env from .env.local (and .env if present).
 * Supports Vercel Postgres (POSTGRES_PRISMA_URL, POSTGRES_URL_NON_POOLING).
 */
import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  normalizeDbUrl,
  validateSupabaseDbUrls,
  loadEnvFile,
} from "./supabase-db-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

import { readFileSync } from "fs";

const env = { ...process.env };
for (const f of [".env", ".env.local"]) {
  Object.assign(env, loadEnvFile(resolve(root, f), { readFileSync }, existsSync));
}

// Vercel Postgres (non-Supabase): map pooled vs non-pooled only when Supabase vars absent
if (!env.DATABASE_URL?.trim()) {
  env.DATABASE_URL = env.POSTGRES_PRISMA_URL || env.POSTGRES_URL || "";
}
if (!env.DIRECT_URL?.trim()) {
  env.DIRECT_URL =
    env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL_UNPOOLED || "";
}

const dbUrl = normalizeDbUrl(env.DATABASE_URL);
const directUrl = normalizeDbUrl(env.DIRECT_URL);

env.DATABASE_URL = dbUrl;
env.DIRECT_URL = directUrl;

if (!dbUrl) {
  console.error("[apply-production-fix] ERROR: DATABASE_URL is not set.");
  console.error("  Set DATABASE_URL or POSTGRES_PRISMA_URL in .env.local.");
  process.exit(1);
}

if (!/^postgresql:\/\//.test(dbUrl)) {
  console.error("[apply-production-fix] ERROR: Invalid DATABASE_URL. Must start with postgresql://");
  console.error("  Got:", dbUrl ? dbUrl.slice(0, 30) + "..." : "(empty)");
  process.exit(1);
}

const validation = validateSupabaseDbUrls(dbUrl, directUrl);
if (dbUrl.includes("supabase") || directUrl.includes("supabase")) {
  if (!validation.ok) {
    console.error("[apply-production-fix] ERROR: Supabase URL configuration invalid:");
    for (const e of validation.errors) console.error(`  - ${e}`);
    process.exit(1);
  }
} else if (!directUrl) {
  console.error("[apply-production-fix] ERROR: DIRECT_URL is required.");
  process.exit(1);
}

console.log("[apply-production-fix] Applying schema fix...");

const sqlPath = resolve(root, "scripts/fix-production-schema.sql");
const r1 = spawnSync(
  "npx",
  ["prisma", "db", "execute", "--file", sqlPath, "--schema", resolve(root, "prisma/schema.prisma")],
  { stdio: "inherit", env, cwd: root }
);

if (r1.status !== 0) {
  console.error("[apply-production-fix] ERROR: Failed to execute SQL.");
  process.exit(1);
}

console.log("[apply-production-fix] SQL executed successfully. Marking migration as applied...");

const r2 = spawnSync(
  "npx",
  ["prisma", "migrate", "resolve", "--applied", "20250308120000_add_product_status_and_extras", "--schema", resolve(root, "prisma/schema.prisma")],
  { stdio: "pipe", env, cwd: root, encoding: "utf-8" }
);

if (r2.status !== 0) {
  const stderr = r2.stderr || r2.stdout || "";
  if (stderr.includes("already recorded as applied")) {
    console.log("[apply-production-fix] Migration already marked as applied. Done.");
  } else {
    console.error("[apply-production-fix] WARNING: SQL applied but migrate resolve failed.");
    if (r2.stderr) console.error(r2.stderr);
    if (r2.stdout) console.error(r2.stdout);
    console.error("  Run manually: npx prisma migrate resolve --applied 20250308120000_add_product_status_and_extras");
    process.exit(1);
  }
} else {
  console.log("[apply-production-fix] Done. Migration marked as applied.");
}

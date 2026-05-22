#!/usr/bin/env node
/**
 * Loads Prisma env from explicit file(s). Validates Supabase URL roles.
 * Never copies DATABASE_URL into DIRECT_URL.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import {
  cleanDbUrl,
  normalizeDbUrl,
  validateSupabaseDbUrls,
  loadEnvFile,
} from "./supabase-db-env.mjs";

/**
 * @param {string[]} envFiles - paths relative to cwd, loaded in order (later wins)
 * @returns {Record<string, string>}
 */
export function loadPrismaEnv(envFiles = [".env", ".env.local"]) {
  const env = { ...process.env };
  for (const file of envFiles) {
    Object.assign(env, loadEnvFile(resolve(process.cwd(), file), { readFileSync }, existsSync));
  }

  env.DATABASE_URL = normalizeDbUrl(env.DATABASE_URL);
  env.DIRECT_URL = normalizeDbUrl(env.DIRECT_URL);

  return env;
}

/**
 * @param {Record<string, string>} env
 * @param {{ label?: string, requireBoth?: boolean }} [opts]
 */
export function assertSupabasePrismaEnv(env, opts = {}) {
  const label = opts.label ?? "prisma-env";
  const { ok, errors, warnings } = validateSupabaseDbUrls(
    env.DATABASE_URL,
    env.DIRECT_URL,
  );

  for (const w of warnings) {
    console.warn(`[${label}] Warning: ${w}`);
  }

  if (!env.DATABASE_URL?.trim()) {
    console.error(`[${label}] DATABASE_URL is not set.`);
    process.exit(1);
  }

  if (opts.requireBoth !== false && !env.DIRECT_URL?.trim()) {
    console.error(`[${label}] DIRECT_URL is not set.`);
    console.error(
      "  Supabase: pooler :6543 on DATABASE_URL, direct db.<ref>.supabase.co:5432 on DIRECT_URL.",
    );
    process.exit(1);
  }

  if (!ok) {
    console.error(`[${label}] Invalid database URL configuration:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

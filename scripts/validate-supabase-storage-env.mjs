#!/usr/bin/env node
/**
 * Validate Supabase Storage env vars for Mission Hub + Newsletter uploads.
 * Usage: node scripts/validate-supabase-storage-env.mjs [.env.local]
 */
import fs from "node:fs";
import path from "node:path";

const envFile = process.argv[2] ?? ".env.local";
const root = process.cwd();
const envPath = path.join(root, envFile);

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function normalize(value) {
  if (!value) return undefined;
  const v = value.replace(/^\uFEFF/, "").trim();
  return v.length > 0 ? v : undefined;
}

function isLegacyJwt(key) {
  if (!key || key.length < 100 || !key.startsWith("eyJ")) return false;
  return key.split(".").length === 3;
}

const fileEnv = parseEnvFile(envPath);
const url =
  normalize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL) ??
  normalize(fileEnv.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.SUPABASE_URL);
const serviceRole =
  normalize(process.env.SUPABASE_SERVICE_ROLE_KEY) ??
  normalize(fileEnv.SUPABASE_SERVICE_ROLE_KEY);
const anon =
  normalize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ??
  normalize(fileEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const missing = [];
if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
if (!serviceRole) missing.push("SUPABASE_SERVICE_ROLE_KEY");

console.log(`[validate:supabase-storage] file: ${envPath}`);
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${url ? "set" : "MISSING"}`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${serviceRole ? `set (${serviceRole.length} chars)` : "MISSING"}`);
console.log(
  `  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${anon ? `set (${anon.length} chars)` : "optional — not set"}`,
);

if (serviceRole && !isLegacyJwt(serviceRole)) {
  console.error("  SUPABASE_SERVICE_ROLE_KEY: invalid — use legacy service_role JWT (eyJ..., 3 parts)");
  process.exit(1);
}

if (missing.length > 0) {
  console.error(
    `[validate:supabase-storage] Supabase Storage is not configured. Missing ${missing.join(", ")}.`,
  );
  console.error("  See docs/supabase-newsletter-assets.md");
  process.exit(1);
}

console.log("[validate:supabase-storage] OK — Storage uploads can run with this env file.");

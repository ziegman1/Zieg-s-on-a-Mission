import fs from "node:fs";
import path from "node:path";

/** Supabase project URL (public — safe for browser; also used server-side). */
export const COMMUNITY_MEDIA_BUCKET = "community-media";

/** Newsletter Builder images (headers, footers, blocks, featured). */
export const NEWSLETTER_ASSETS_BUCKET = "newsletter-assets";

export type SupabaseServiceRoleKeyIssue =
  | "missing"
  | "placeholder"
  | "new_secret_format"
  | "publishable_key"
  | "not_jwt";

/** Minimum length for a real Supabase service_role JWT (placeholders are ~40 chars). */
const MIN_SERVICE_ROLE_JWT_LENGTH = 100;

/** Strip BOM and optional surrounding quotes from .env values. */
export function normalizeEnvValue(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  let v = value.replace(/^\uFEFF/, "").trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v.length > 0 ? v : undefined;
}

/** True when the key looks like a legacy Supabase JWT (service_role / anon). */
export function isLegacySupabaseJwtKey(key: string): boolean {
  const trimmed = normalizeEnvValue(key) ?? "";
  if (trimmed.length < MIN_SERVICE_ROLE_JWT_LENGTH) return false;
  if (!trimmed.startsWith("eyJ")) return false;
  return trimmed.split(".").length === 3;
}

function isPlaceholderServiceRoleKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    key.length < MIN_SERVICE_ROLE_JWT_LENGTH ||
    lower.includes("replace_with") ||
    lower.includes("your_") ||
    lower.includes("changeme") ||
    lower.includes("paste_") ||
    lower === "eyj..." ||
    lower.startsWith("eyj...")
  );
}

/**
 * Diagnose SUPABASE_SERVICE_ROLE_KEY before calling @supabase/supabase-js.
 * Storage uploads need the legacy service_role JWT — not sb_secret_... keys.
 */
export function diagnoseSupabaseServiceRoleKey(
  key?: string,
): SupabaseServiceRoleKeyIssue | null {
  const trimmed = normalizeEnvValue(key);
  if (!trimmed) return "missing";
  if (isPlaceholderServiceRoleKey(trimmed)) return "placeholder";
  if (trimmed.startsWith("sb_secret_")) return "new_secret_format";
  if (trimmed.startsWith("sb_publishable_")) return "publishable_key";
  if (!isLegacySupabaseJwtKey(trimmed)) return "not_jwt";
  return null;
}

export function supabaseServiceRoleKeyErrorMessage(
  issue: SupabaseServiceRoleKeyIssue,
): string {
  switch (issue) {
    case "missing":
      return (
        "SUPABASE_SERVICE_ROLE_KEY is missing at runtime. Add it to .env.local, save the file, " +
        "and restart the dev server (npm run dev). See docs/supabase-community-media.md."
      );
    case "placeholder":
      return (
        "SUPABASE_SERVICE_ROLE_KEY is still a placeholder or too short (expected a long eyJ... JWT). " +
        "Open .env.local, paste the legacy service_role key from Supabase Dashboard → Settings → API Keys → " +
        "Legacy API Keys, save the file, then fully restart npm run dev."
      );
    case "new_secret_format":
      return (
        "SUPABASE_SERVICE_ROLE_KEY is a new-format sb_secret_ key. " +
        "@supabase/supabase-js sends it as a Bearer JWT and Supabase returns \"Invalid Compact JWS\". " +
        "Use the legacy service_role JWT instead: Dashboard → Settings → API Keys → " +
        "Legacy API Keys → service_role (long value starting with eyJ...)."
      );
    case "publishable_key":
      return (
        "SUPABASE_SERVICE_ROLE_KEY looks like a publishable key (sb_publishable_...). " +
        "Use the legacy service_role JWT (eyJ...) from Legacy API Keys — never a publishable or anon key."
      );
    case "not_jwt":
      return (
        "SUPABASE_SERVICE_ROLE_KEY is not a valid legacy service_role JWT (must start with eyJ, " +
        "three dot-separated parts, ~200+ characters). Copy service_role from Legacy API Keys, " +
        "save .env.local, and restart npm run dev."
      );
  }
}

export function getSupabaseProjectUrl(): string | undefined {
  const url = normalizeEnvValue(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
  );
  if (!url) return undefined;
  return url.replace(/\/$/, "");
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseServiceRoleKeyIssue(): SupabaseServiceRoleKeyIssue | null {
  return diagnoseSupabaseServiceRoleKey(getSupabaseServiceRoleKey());
}

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(getSupabaseProjectUrl() && getSupabaseServiceRoleKey());
}

/** Throws a clear Error if URL or service_role JWT is missing or wrong format. */
export function assertSupabaseStorageReady(): void {
  const url = getSupabaseProjectUrl();
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is missing. Set your project URL in .env.local (see docs/supabase-community-media.md).",
    );
  }
  const keyIssue = getSupabaseServiceRoleKeyIssue();
  if (keyIssue) {
    throw new Error(supabaseServiceRoleKeyErrorMessage(keyIssue));
  }
}

export type SupabaseEnvDebugInfo = {
  keyPrefix: string;
  keyLength: number;
  keyIssue: SupabaseServiceRoleKeyIssue | null;
  runtimeKeyDefined: boolean;
  envFilesChecked: string[];
  duplicateDefinitionsInEnvLocal: number;
  devCommandHint: string;
};

/**
 * Server-only diagnostics for upload debugging. Logs first 20 chars of the key, never the full value.
 * Call from API routes; output appears in the terminal running `npm run dev`.
 */
export function logSupabaseServiceRoleKeyDebug(context: string): SupabaseEnvDebugInfo {
  const key = getSupabaseServiceRoleKey();
  const keyIssue = getSupabaseServiceRoleKeyIssue();
  const projectRoot = process.cwd();
  const envLocalPath = path.join(projectRoot, ".env.local");
  const envPath = path.join(projectRoot, ".env");

  let duplicateDefinitionsInEnvLocal = 0;
  const envFilesChecked: string[] = [];

  for (const filePath of [envPath, envLocalPath]) {
    if (!fs.existsSync(filePath)) continue;
    envFilesChecked.push(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    const matches = content.match(/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=/gm);
    if (filePath === envLocalPath && matches) {
      duplicateDefinitionsInEnvLocal = matches.length;
    }
  }

  const info: SupabaseEnvDebugInfo = {
    keyPrefix: key ? key.slice(0, 20) : "(undefined)",
    keyLength: key?.length ?? 0,
    keyIssue,
    runtimeKeyDefined: Boolean(key),
    envFilesChecked,
    duplicateDefinitionsInEnvLocal,
    devCommandHint:
      "Use npm run dev (loads .env.local via dotenv). After any .env.local edit, stop and restart the dev server — Next.js caches env at startup.",
  };

  console.warn(`[supabase/env-debug:${context}]`, {
    ...info,
    NEXT_PUBLIC_SUPABASE_URL_defined: Boolean(getSupabaseProjectUrl()),
    NODE_ENV: process.env.NODE_ENV,
  });

  return info;
}

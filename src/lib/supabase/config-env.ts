/** Supabase env helpers — safe for client and server (no node:fs). */

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

/** Public anon key — optional for server Storage uploads; used if browser Supabase client is added later. */
export function getSupabaseAnonKey(): string | undefined {
  return normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return normalizeEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export type SupabaseStorageConfigProblem = {
  variable: "NEXT_PUBLIC_SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY";
  kind: "missing" | "invalid";
};

/** Variables required for server-side Storage uploads (newsletter + Mission Hub media). */
export function getSupabaseStorageConfigProblems(): SupabaseStorageConfigProblem[] {
  const problems: SupabaseStorageConfigProblem[] = [];
  if (!getSupabaseProjectUrl()) {
    problems.push({ variable: "NEXT_PUBLIC_SUPABASE_URL", kind: "missing" });
  }
  const keyIssue = getSupabaseServiceRoleKeyIssue();
  if (keyIssue === "missing") {
    problems.push({ variable: "SUPABASE_SERVICE_ROLE_KEY", kind: "missing" });
  } else if (keyIssue) {
    problems.push({ variable: "SUPABASE_SERVICE_ROLE_KEY", kind: "invalid" });
  }
  return problems;
}

/** User-facing message when Storage env is incomplete (upload routes). */
export function supabaseStorageNotConfiguredMessage(
  problems?: SupabaseStorageConfigProblem[],
): string {
  const items = problems ?? getSupabaseStorageConfigProblems();
  if (items.length === 0) {
    return "Supabase Storage is not configured.";
  }
  const missing = items.filter((p) => p.kind === "missing").map((p) => p.variable);
  if (missing.length === 1) {
    return `Supabase Storage is not configured. Missing ${missing[0]}.`;
  }
  if (missing.length > 1) {
    return `Supabase Storage is not configured. Missing ${missing.join(", ")}.`;
  }
  return "Supabase Storage is not configured. Invalid SUPABASE_SERVICE_ROLE_KEY.";
}

export function getSupabaseServiceRoleKeyIssue(): SupabaseServiceRoleKeyIssue | null {
  return diagnoseSupabaseServiceRoleKey(getSupabaseServiceRoleKey());
}

export function isSupabaseStorageConfigured(): boolean {
  return getSupabaseStorageConfigProblems().length === 0;
}

/** Throws a clear Error if URL or service_role JWT is missing or wrong format. */
export function assertSupabaseStorageReady(): void {
  const problems = getSupabaseStorageConfigProblems();
  if (problems.length > 0) {
    const missingUrl = problems.some(
      (p) => p.variable === "NEXT_PUBLIC_SUPABASE_URL" && p.kind === "missing",
    );
    if (missingUrl) {
      throw new Error(supabaseStorageNotConfiguredMessage(problems));
    }
    const keyIssue = getSupabaseServiceRoleKeyIssue();
    if (keyIssue) {
      throw new Error(supabaseServiceRoleKeyErrorMessage(keyIssue));
    }
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

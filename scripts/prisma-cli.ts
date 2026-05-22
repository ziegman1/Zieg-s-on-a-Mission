/**
 * Prisma client for local CLI scripts (check, seed, diagnostics).
 * Prefers DIRECT_URL — avoids Supabase transaction pooler ENOIDENTIFIER / reachability issues.
 * App runtime on Vercel continues to use DATABASE_URL via @/lib/db.
 */
import { PrismaClient } from "@prisma/client";

export function cleanDbUrl(url: string | undefined): string {
  return (url ?? "").trim().replace(/^["']|["']$/g, "");
}

export function normalizeDbUrl(url: string): string {
  const u = cleanDbUrl(url);
  if (!u) return u;
  if (u.startsWith("postgres://")) return "postgresql://" + u.slice(11);
  return u;
}

export function parseDbTarget(url: string): { hostname: string; port: string; db: string } | null {
  try {
    const normalized = normalizeDbUrl(url).replace(/^postgresql:\/\//, "http://");
    const parsed = new URL(normalized);
    return {
      hostname: parsed.hostname,
      port: parsed.port || "5432",
      db: parsed.pathname.replace(/^\//, "") || "postgres",
    };
  } catch {
    return null;
  }
}

export function formatDbTarget(url: string): string {
  const p = parseDbTarget(url);
  if (!p) return "(could not parse URL)";
  return `${p.hostname}:${p.port}/${p.db}`;
}

export function maskDbUrl(url: string): string {
  try {
    const normalized = normalizeDbUrl(url).replace(/^postgresql:\/\//, "http://");
    const u = new URL(normalized);
    return `postgresql://***@${u.hostname}${u.pathname}${u.search}`;
  } catch {
    return "(invalid URL)";
  }
}

export type CliDatabaseSource =
  | "DIRECT_URL"
  | "DATABASE_URL"
  | "MISSION_HUB_CLI_DATABASE_URL"
  | "session pooler :5432 (CLI fallback)";

const POOLER_HOST = /\.pooler\.supabase\.com$/i;
const DIRECT_HOST = /^db\.[a-z0-9]+\.supabase\.co$/i;

/**
 * Session-mode pooler on :5432 (same host as transaction pooler, no pgbouncer).
 * Use when db.<ref>.supabase.co:5432 is unreachable from local IPv4 networks.
 */
export function deriveSessionPoolerUrl(databaseUrl: string): string | null {
  const p = parseDbTarget(databaseUrl);
  if (!p || !POOLER_HOST.test(p.hostname) || p.port !== "6543") return null;
  try {
    const httpish = normalizeDbUrl(databaseUrl).replace(/^postgresql:\/\//, "http://");
    const u = new URL(httpish);
    u.port = "5432";
    u.searchParams.delete("pgbouncer");
    return `postgresql://${decodeURIComponent(u.username)}:${decodeURIComponent(u.password)}@${u.hostname}:${u.port}${u.pathname}`;
  } catch {
    return null;
  }
}

/** URL used by CLI Prisma — never uses transaction pooler :6543. */
export function resolveCliDatabaseUrl(): { url: string; source: CliDatabaseSource } {
  const override = normalizeDbUrl(process.env.MISSION_HUB_CLI_DATABASE_URL ?? "");
  if (override) {
    return { url: override, source: "MISSION_HUB_CLI_DATABASE_URL" };
  }

  const direct = normalizeDbUrl(process.env.DIRECT_URL ?? "");
  const pooled = normalizeDbUrl(process.env.DATABASE_URL ?? "");
  const sessionPooler = pooled ? deriveSessionPoolerUrl(pooled) : null;
  const directTarget = direct ? parseDbTarget(direct) : null;
  const forceDirect = process.env.MISSION_HUB_CLI_USE_DIRECT === "1";

  if (forceDirect && direct) {
    return { url: direct, source: "DIRECT_URL" };
  }

  if (
    sessionPooler &&
    directTarget &&
    DIRECT_HOST.test(directTarget.hostname) &&
    !forceDirect
  ) {
    return { url: sessionPooler, source: "session pooler :5432 (CLI fallback)" };
  }

  if (direct) {
    return { url: direct, source: "DIRECT_URL" };
  }

  if (sessionPooler) {
    return { url: sessionPooler, source: "session pooler :5432 (CLI fallback)" };
  }

  if (pooled) {
    console.warn(
      "[prisma-cli] Using DATABASE_URL for CLI — transaction pooler :6543 may fail with ENOIDENTIFIER.",
    );
    return { url: pooled, source: "DATABASE_URL" };
  }

  throw new Error("DIRECT_URL or DATABASE_URL must be set for CLI scripts.");
}

export function createPrismaCliClient(logPrefix = "prisma-cli"): PrismaClient {
  const direct = normalizeDbUrl(process.env.DIRECT_URL ?? "");
  const { url, source } = resolveCliDatabaseUrl();
  if (direct) {
    console.log(`[${logPrefix}] DIRECT_URL host (migrations / intended direct): ${formatDbTarget(direct)}`);
  }
  console.log(`[${logPrefix}] Prisma connection uses ${source}: ${formatDbTarget(url)}`);
  if (source === "session pooler :5432 (CLI fallback)") {
    console.log(
      `[${logPrefix}] Tip: db.*.supabase.co is often blocked locally. Set MISSION_HUB_CLI_USE_DIRECT=1 to force DIRECT_URL.`,
    );
  }
  return new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

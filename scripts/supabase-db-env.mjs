/**
 * Supabase + Prisma connection URL helpers.
 *
 * DATABASE_URL — transaction pooler (aws-*-*.pooler.supabase.com:6543, ?pgbouncer=true)
 * DIRECT_URL     — direct host (db.<project-ref>.supabase.co:5432)
 *
 * Do not copy DATABASE_URL into DIRECT_URL; they serve different purposes.
 */

export function cleanDbUrl(url) {
  if (!url || typeof url !== "string") return "";
  return url
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\s+/g, "")
    .trim();
}

export function normalizeDbUrl(url) {
  const u = cleanDbUrl(url);
  if (!u) return u;
  if (u.startsWith("postgres://")) return "postgresql://" + u.slice(11);
  return u;
}

/** @returns {{ hostname: string, port: string, db: string, hasPgbouncer: boolean } | null} */
export function parseDbTarget(url) {
  const normalized = normalizeDbUrl(url);
  if (!normalized) return null;
  try {
    const httpish = normalized.replace(/^postgresql:\/\//, "http://");
    const u = new URL(httpish);
    const db = u.pathname.replace(/^\//, "") || "postgres";
    return {
      hostname: u.hostname,
      port: u.port || "5432",
      db,
      hasPgbouncer: u.searchParams.has("pgbouncer"),
    };
  } catch {
    return null;
  }
}

/** Display form: host:port/db (no query string). */
export function formatDbTarget(url) {
  const p = parseDbTarget(url);
  if (!p) return "(could not parse URL)";
  return `${p.hostname}:${p.port}/${p.db}`;
}

const POOLER_HOST_RE = /\.pooler\.supabase\.com$/i;
const DIRECT_HOST_RE = /^db\.[a-z0-9]+\.supabase\.co$/i;

/**
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
export function validateSupabaseDbUrls(databaseUrl, directUrl) {
  const errors = [];
  const warnings = [];
  const db = parseDbTarget(databaseUrl);
  const direct = parseDbTarget(directUrl);

  if (!db) errors.push("DATABASE_URL is missing or invalid.");
  if (!direct) errors.push("DIRECT_URL is missing or invalid.");

  if (db) {
    if (!POOLER_HOST_RE.test(db.hostname)) {
      errors.push(
        `DATABASE_URL must use the transaction pooler host (*.pooler.supabase.com), got ${db.hostname}`,
      );
    }
    if (db.port !== "6543") {
      errors.push(`DATABASE_URL must use port 6543 (transaction pooler), got ${db.port}`);
    }
    if (!db.hasPgbouncer) {
      warnings.push("DATABASE_URL should include ?pgbouncer=true for Prisma on serverless.");
    }
    if (DIRECT_HOST_RE.test(db.hostname)) {
      errors.push(
        "DATABASE_URL must not use db.<ref>.supabase.co — that belongs on DIRECT_URL only.",
      );
    }
  }

  if (direct) {
    if (!DIRECT_HOST_RE.test(direct.hostname)) {
      errors.push(
        `DIRECT_URL must use db.<project-ref>.supabase.co, got ${direct.hostname}`,
      );
    }
    if (direct.port !== "5432") {
      errors.push(`DIRECT_URL must use port 5432 (direct), got ${direct.port}`);
    }
    if (POOLER_HOST_RE.test(direct.hostname)) {
      errors.push(
        "DIRECT_URL must not use the pooler host — use db.<ref>.supabase.co:5432 for migrations.",
      );
    }
  }

  if (
    databaseUrl &&
    directUrl &&
    cleanDbUrl(databaseUrl) === cleanDbUrl(directUrl)
  ) {
    errors.push("DATABASE_URL and DIRECT_URL must not be identical.");
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function loadEnvFile(path, fs, existsSync) {
  if (!existsSync(path)) return {};
  const content = fs.readFileSync(path, "utf-8");
  const out = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

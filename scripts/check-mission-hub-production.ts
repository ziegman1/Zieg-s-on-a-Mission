/**
 * Read-only production / remote DB diagnostics for Mission Hub.
 *
 * Usage:
 *   npm run db:check:production
 *   dotenv -e .env.production -- tsx scripts/check-mission-hub-production.ts
 */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_MISSION_HUB_SPACES } from "../prisma/mission-hub-default-spaces";

const prisma = new PrismaClient();

function cleanUrl(url: string | undefined): string {
  return (url ?? "").trim().replace(/^["']|["']$/g, "");
}

function normalizeUrl(url: string): string {
  const u = cleanUrl(url);
  if (u.startsWith("postgres://")) return "postgresql://" + u.slice(11);
  return u;
}

function parseDbTarget(url: string): { hostname: string; port: string; db: string } | null {
  try {
    const normalized = normalizeUrl(url).replace(/^postgresql:\/\//, "http://");
    const u = new URL(normalized);
    return {
      hostname: u.hostname,
      port: u.port || "5432",
      db: u.pathname.replace(/^\//, "") || "postgres",
    };
  } catch {
    return null;
  }
}

function formatDbTarget(url: string): string {
  const p = parseDbTarget(url);
  if (!p) return "(could not parse URL)";
  return `${p.hostname}:${p.port}/${p.db}`;
}

const POOLER_HOST = /\.pooler\.supabase\.com$/i;
const DIRECT_HOST = /^db\.[a-z0-9]+\.supabase\.co$/i;

function validateSupabaseUrls(databaseUrl: string, directUrl: string): string[] {
  const errors: string[] = [];
  const db = parseDbTarget(databaseUrl);
  const direct = parseDbTarget(directUrl);

  if (!db) errors.push("DATABASE_URL is invalid.");
  if (!direct) errors.push("DIRECT_URL is invalid.");

  if (db) {
    if (!POOLER_HOST.test(db.hostname)) {
      errors.push(`DATABASE_URL must use *.pooler.supabase.com (got ${db.hostname})`);
    }
    if (db.port !== "6543") {
      errors.push(`DATABASE_URL must use port 6543 (got ${db.port})`);
    }
    if (DIRECT_HOST.test(db.hostname)) {
      errors.push("DATABASE_URL must not use db.<ref>.supabase.co (reversed with DIRECT_URL)");
    }
  }

  if (direct) {
    if (!DIRECT_HOST.test(direct.hostname)) {
      errors.push(`DIRECT_URL must use db.<ref>.supabase.co (got ${direct.hostname})`);
    }
    if (direct.port !== "5432") {
      errors.push(`DIRECT_URL must use port 5432 (got ${direct.port})`);
    }
    if (POOLER_HOST.test(direct.hostname)) {
      errors.push("DIRECT_URL must not use pooler host (reversed with DATABASE_URL)");
    }
  }

  if (databaseUrl && directUrl && cleanUrl(databaseUrl) === cleanUrl(directUrl)) {
    errors.push("DATABASE_URL and DIRECT_URL must not be identical.");
  }

  return errors;
}

function maskUrl(url: string): string {
  try {
    const normalized = normalizeUrl(url).replace(/^postgresql:\/\//, "http://");
    const u = new URL(normalized);
    return `postgresql://***@${u.hostname}${u.pathname}${u.search}`;
  } catch {
    return "(invalid URL)";
  }
}

async function main(): Promise<void> {
  const databaseUrl = cleanUrl(process.env.DATABASE_URL);
  const directUrl = cleanUrl(process.env.DIRECT_URL);

  console.log("[check:mission-hub] DATABASE_URL host:", formatDbTarget(databaseUrl));
  console.log("[check:mission-hub] DIRECT_URL host:", formatDbTarget(directUrl));
  console.log("[check:mission-hub] masked DATABASE_URL:", maskUrl(databaseUrl));

  const configErrors = validateSupabaseUrls(databaseUrl, directUrl);
  if (configErrors.length > 0) {
    console.error("[check:mission-hub] URL configuration errors:");
    for (const e of configErrors) {
      console.error(`  - ${e}`);
    }
    console.error(
      "[check:mission-hub] Fix Vercel / .env.production: pooler :6543 on DATABASE_URL, db.* :5432 on DIRECT_URL.",
    );
    process.exit(1);
  }

  if (!databaseUrl) {
    console.error("[check:mission-hub] DATABASE_URL is not set.");
    process.exit(1);
  }

  try {
    const migrations = await prisma.$queryRaw<
      { migration_name: string; finished_at: Date | null }[]
    >`
      SELECT migration_name, finished_at
      FROM "_prisma_migrations"
      ORDER BY finished_at NULLS LAST, migration_name
    `;

    const pending = migrations.filter((m) => m.finished_at === null);
    console.log(
      `[check:mission-hub] Prisma migrations applied: ${migrations.length - pending.length}`,
    );
    if (pending.length > 0) {
      console.warn("[check:mission-hub] Pending / failed migrations:");
      for (const m of pending) {
        console.warn(`  - ${m.migration_name}`);
      }
      console.warn("  Run: npm run db:migrate:deploy:production");
    } else {
      const latest = migrations[migrations.length - 1];
      if (latest) {
        console.log(`[check:mission-hub] Latest applied: ${latest.migration_name}`);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[check:mission-hub] Could not read _prisma_migrations:", msg);
    console.warn("  Tables may not exist yet — run db:migrate:deploy:production first.");
  }

  try {
    const spaces = await prisma.communitySpaceRecord.findMany({
      select: { slug: true, title: true, status: true, sortOrder: true },
      orderBy: { sortOrder: "asc" },
    });

    const byStatus = spaces.reduce(
      (acc, s) => {
        acc[s.status] = (acc[s.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log("[check:mission-hub] community_spaces:", {
      total: spaces.length,
      byStatus,
    });

    if (spaces.length > 0) {
      console.log("[check:mission-hub] Spaces in database:");
      for (const s of spaces) {
        console.log(`  - ${s.slug} (${s.status}) — ${s.title}`);
      }
    }

    const expectedSlugs = DEFAULT_MISSION_HUB_SPACES.map((d) => d.slug);
    const missing = expectedSlugs.filter(
      (slug) => !spaces.some((s) => s.slug === slug),
    );
    const unpublishedDefaults = expectedSlugs.filter((slug) => {
      const row = spaces.find((s) => s.slug === slug);
      return row && row.status !== "published";
    });

    if (missing.length > 0) {
      console.warn("[check:mission-hub] Missing default slugs:", missing.join(", "));
      console.warn(
        "  Run: MISSION_HUB_SEED_CONFIRM=production npm run db:seed:mission-hub:production",
      );
    }
    if (unpublishedDefaults.length > 0) {
      console.warn(
        "[check:mission-hub] Default spaces exist but are not published:",
        unpublishedDefaults.join(", "),
      );
      console.warn("  Publish them in admin — seed does not change existing rows.");
    }

    const postCounts = await prisma.communityPostRecord.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    console.log("[check:mission-hub] community_posts by status:", postCounts);
    console.log("[check:mission-hub] Database connection OK.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[check:mission-hub] community_* query failed:", msg);
    process.exit(1);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

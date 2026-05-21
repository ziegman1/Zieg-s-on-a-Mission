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

function describeDatabaseTarget(url: string): string {
  try {
    const normalized = url.replace(/^postgresql:\/\//, "http://");
    const u = new URL(normalized);
    const db = u.pathname.replace(/^\//, "") || "(default)";
    const pooler = u.searchParams.has("pgbouncer") ? " (pooler/pgbouncer)" : "";
    return `${u.hostname}:${u.port || "5432"}/${db}${pooler}`;
  } catch {
    return "(could not parse DATABASE_URL)";
  }
}

function maskUrl(url: string): string {
  try {
    const normalized = url.replace(/^postgresql:\/\//, "http://");
    const u = new URL(normalized);
    return `postgresql://***@${u.hostname}${u.pathname}${u.search}`;
  } catch {
    return "(invalid URL)";
  }
}

async function main(): Promise<void> {
  const databaseUrl = cleanUrl(process.env.DATABASE_URL);
  const directUrl = cleanUrl(process.env.DIRECT_URL);

  console.log("[check:mission-hub] DATABASE_URL host:", describeDatabaseTarget(databaseUrl));
  if (directUrl && directUrl !== databaseUrl) {
    console.log("[check:mission-hub] DIRECT_URL host:", describeDatabaseTarget(directUrl));
  } else {
    console.log("[check:mission-hub] DIRECT_URL: (same as DATABASE_URL or unset)");
  }
  console.log("[check:mission-hub] masked DATABASE_URL:", maskUrl(databaseUrl));

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
      console.warn("  Run: MISSION_HUB_SEED_CONFIRM=production npm run db:seed:mission-hub:production");
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

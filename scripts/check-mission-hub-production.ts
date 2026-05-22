/**
 * Read-only production / remote DB diagnostics for Mission Hub.
 * Connects via DIRECT_URL (not the transaction pooler) for local CLI reliability.
 *
 * Usage:
 *   npm run db:check:production
 */
import { DEFAULT_MISSION_HUB_SPACES } from "../prisma/mission-hub-default-spaces";
import {
  createPrismaCliClient,
  deriveSessionPoolerUrl,
  formatDbTarget,
  maskDbUrl,
  normalizeDbUrl,
  parseDbTarget,
} from "./prisma-cli";

const POOLER_HOST = /\.pooler\.supabase\.com$/i;
const DIRECT_HOST = /^db\.[a-z0-9]+\.supabase\.co$/i;

function validateRuntimeDatabaseUrl(databaseUrl: string): string[] {
  const errors: string[] = [];
  const db = parseDbTarget(databaseUrl);
  if (!db) return ["DATABASE_URL is invalid."];
  if (!POOLER_HOST.test(db.hostname)) {
    errors.push(`DATABASE_URL must use *.pooler.supabase.com (got ${db.hostname})`);
  }
  if (db.port !== "6543") {
    errors.push(`DATABASE_URL must use port 6543 (got ${db.port})`);
  }
  if (DIRECT_HOST.test(db.hostname)) {
    errors.push("DATABASE_URL must not use db.<ref>.supabase.co");
  }
  return errors;
}

function validateCliDirectUrl(directUrl: string): string[] {
  const errors: string[] = [];
  const direct = parseDbTarget(directUrl);
  if (!direct) return ["DIRECT_URL is invalid."];
  if (!DIRECT_HOST.test(direct.hostname)) {
    errors.push(`DIRECT_URL must use db.<ref>.supabase.co (got ${direct.hostname})`);
  }
  if (direct.port !== "5432") {
    errors.push(`DIRECT_URL must use port 5432 (got ${direct.port})`);
  }
  if (POOLER_HOST.test(direct.hostname)) {
    errors.push("DIRECT_URL must not use pooler host — use db.<ref>.supabase.co for CLI");
  }
  return errors;
}

async function diagnosePosts(prisma: ReturnType<typeof createPrismaCliClient>): Promise<void> {
  const now = new Date();

  const total = await prisma.communityPostRecord.count();
  const byStatus = await prisma.communityPostRecord.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  console.log("[check:mission-hub] community_posts total:", total);
  console.log("[check:mission-hub] community_posts by status:", byStatus);

  const published = await prisma.communityPostRecord.count({
    where: { status: "published" },
  });
  const publishedAtNull = await prisma.communityPostRecord.count({
    where: { status: "published", publishedAt: null },
  });
  const publishedAtFuture = await prisma.communityPostRecord.count({
    where: { status: "published", publishedAt: { gt: now } },
  });

  console.log("[check:mission-hub] published posts:", published);
  console.log("[check:mission-hub] published with published_at NULL:", publishedAtNull);
  console.log("[check:mission-hub] published with published_at in future:", publishedAtFuture);

  const feedEligible = await prisma.communityPostRecord.count({
    where: {
      status: "published",
      space: { status: "published" },
    },
  });
  console.log(
    "[check:mission-hub] feed-eligible (published post + published space):",
    feedEligible,
  );

  const orphanedPublished = await prisma.communityPostRecord.count({
    where: {
      status: "published",
      space: { status: { not: "published" } },
    },
  });
  if (orphanedPublished > 0) {
    console.warn(
      "[check:mission-hub] published posts in non-published spaces:",
      orphanedPublished,
    );
  }

  const postsBySpace = await prisma.communityPostRecord.groupBy({
    by: ["spaceId", "status"],
    where: { status: "published" },
    _count: { _all: true },
  });
  const spaces = await prisma.communitySpaceRecord.findMany({
    select: { id: true, slug: true, title: true, status: true },
  });
  const spaceById = new Map(spaces.map((s) => [s.id, s]));

  console.log("[check:mission-hub] published posts by space:");
  for (const row of postsBySpace) {
    const space = spaceById.get(row.spaceId);
    const label = space ? `${space.slug} (space ${space.status})` : row.spaceId;
    console.log(`  - ${label}: ${row._count._all}`);
  }

  const sample = await prisma.communityPostRecord.findMany({
    where: { status: "published" },
    select: {
      id: true,
      title: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      space: { select: { slug: true, status: true } },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 5,
  });
  if (sample.length > 0) {
    console.log("[check:mission-hub] sample published posts:");
    for (const p of sample) {
      console.log(
        `  - ${p.id.slice(0, 8)}… "${p.title ?? "(no title)"}" space=${p.space.slug} (${p.space.status}) published_at=${p.publishedAt?.toISOString() ?? "null"}`,
      );
    }
  }

  if (feedEligible > 0) {
    console.log(
      "[check:mission-hub] If production /community shows spaces but no posts, check Vercel DATABASE_URL (pooler :6543) and server logs for [community] failed to load. RLS may hide rows from the pooler role if misconfigured.",
    );
  }
}

async function main(): Promise<void> {
  const databaseUrl = normalizeDbUrl(process.env.DATABASE_URL ?? "");
  const directUrl = normalizeDbUrl(process.env.DIRECT_URL ?? "");

  console.log("[check:mission-hub] DATABASE_URL host:", formatDbTarget(databaseUrl));
  console.log("[check:mission-hub] DIRECT_URL host:", formatDbTarget(directUrl));
  console.log("[check:mission-hub] masked DATABASE_URL:", maskDbUrl(databaseUrl));
  console.log("[check:mission-hub] masked DIRECT_URL:", maskDbUrl(directUrl));

  const runtimeErrors = databaseUrl ? validateRuntimeDatabaseUrl(databaseUrl) : [];
  const cliErrors = directUrl ? validateCliDirectUrl(directUrl) : ["DIRECT_URL is not set."];

  if (runtimeErrors.length > 0) {
    console.warn("[check:mission-hub] Vercel runtime DATABASE_URL issues (app may fail):");
    for (const e of runtimeErrors) console.warn(`  - ${e}`);
  }

  const sessionFallback = databaseUrl ? deriveSessionPoolerUrl(databaseUrl) : null;
  if (cliErrors.length > 0) {
    console.warn("[check:mission-hub] DIRECT_URL config issues:");
    for (const e of cliErrors) console.warn(`  - ${e}`);
    if (!sessionFallback) {
      console.error("[check:mission-hub] No CLI fallback available (fix DIRECT_URL or DATABASE_URL).");
      process.exit(1);
    }
    console.warn(
      "[check:mission-hub] CLI will use session pooler :5432 derived from DATABASE_URL.",
    );
  }

  const prisma = createPrismaCliClient("check:mission-hub");

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

    if (missing.length > 0) {
      console.warn("[check:mission-hub] Missing default slugs:", missing.join(", "));
    }

    await diagnosePosts(prisma);
    console.log("[check:mission-hub] Database connection OK.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[check:mission-hub] community_* query failed:", msg);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

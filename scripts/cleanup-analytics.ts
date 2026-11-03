/**
 * Manual retention cleanup for first-party analytics.
 *
 * Default: delete expired analytics_sessions only (events cascade).
 * PageView rows are NOT deleted unless --include-page-views is passed.
 *
 * Usage:
 *   dotenv -e .env.local -- npx tsx scripts/cleanup-analytics.ts --days=90 --dry-run
 *   dotenv -e .env.local -- npx tsx scripts/cleanup-analytics.ts --days=90
 *   dotenv -e .env.local -- npx tsx scripts/cleanup-analytics.ts --days=90 --include-page-views
 *
 * Does NOT touch Mission Hub community_hub_activity_events.
 * Never run against production without explicit approval.
 * Dry-run never deletes.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

async function main() {
  const days = Math.max(1, Number(arg("days") ?? "90") || 90);
  const dryRun = process.argv.includes("--dry-run");
  const includePageViews = process.argv.includes("--include-page-views");
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const [events, sessions, pageViews] = await Promise.all([
    prisma.analyticsEvent.count({ where: { createdAt: { lt: cutoff } } }),
    prisma.analyticsSession.count({ where: { createdAt: { lt: cutoff } } }),
    prisma.pageView.count({ where: { createdAt: { lt: cutoff } } }),
  ]);

  console.log(`Cutoff: ${cutoff.toISOString()} (${days} days)`);
  console.log(`analytics_events (via session cascade): ${events}`);
  console.log(`analytics_sessions: ${sessions}`);
  console.log(`PageView (optional): ${pageViews}`);
  console.log(
    includePageViews
      ? "PageView deletion: ENABLED (--include-page-views)"
      : "PageView deletion: DISABLED (default — history preserved)",
  );

  if (dryRun) {
    console.log("Dry run — no deletes.");
    return;
  }

  // Sessions cascade to analytics_events. PageView has no FK to sessions,
  // so session cleanup cannot delete or corrupt PageView history.
  const delSessions = await prisma.analyticsSession.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  console.log(`Deleted sessions: ${delSessions.count} (events cascaded)`);

  if (includePageViews) {
    const delViews = await prisma.pageView.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    console.log(`Deleted page views: ${delViews.count}`);
  } else {
    console.log("Skipped PageView deletion.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

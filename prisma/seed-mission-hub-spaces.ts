/**
 * Idempotent Mission Hub space bootstrap.
 *
 * - Creates only spaces whose slug does not exist (never updates existing rows).
 * - New rows are created with status = published.
 * - Does not seed posts, comments, or hub settings.
 *
 * Local:  npm run db:seed:mission-hub
 * Production: see docs/mission-hub-production-setup.md
 */
import {
  DEFAULT_MISSION_HUB_SPACES,
  defaultSpaceToCreateInput,
} from "./mission-hub-default-spaces";
import {
  createPrismaCliClient,
  formatDbTarget,
  normalizeDbUrl,
} from "../scripts/prisma-cli";

const POOLER_HOST = /\.pooler\.supabase\.com$/i;
const DIRECT_HOST = /^db\.[a-z0-9]+\.supabase\.co$/i;

function assertSupabaseUrlRoles(databaseUrl: string, directUrl: string): void {
  const errors: string[] = [];
  try {
    const db = new URL(databaseUrl.replace(/^postgresql:\/\//, "http://"));
    const direct = new URL(directUrl.replace(/^postgresql:\/\//, "http://"));
    if (!POOLER_HOST.test(db.hostname) || db.port !== "6543") {
      errors.push("DATABASE_URL must be pooler host :6543");
    }
    if (!DIRECT_HOST.test(direct.hostname) || direct.port !== "5432") {
      errors.push("DIRECT_URL must be db.<ref>.supabase.co :5432");
    }
    if (databaseUrl === directUrl) {
      errors.push("DATABASE_URL and DIRECT_URL must differ");
    }
  } catch {
    errors.push("Invalid DATABASE_URL or DIRECT_URL");
  }
  if (errors.length > 0) {
    console.error("[seed:mission-hub] URL configuration errors:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
}

function isLocalDatabase(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

function requireRemoteSeedConfirmation(cliUrl: string): void {
  if (isLocalDatabase(cliUrl)) return;
  if (process.env.MISSION_HUB_SEED_CONFIRM === "production") return;
  console.error(
    "[seed:mission-hub] Refusing to write to a non-local database.",
  );
  console.error(
    "  Copy production DATABASE_URL into .env.production (gitignored), then run:",
  );
  console.error(
    "  MISSION_HUB_SEED_CONFIRM=production npm run db:seed:mission-hub:production",
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const databaseUrl = normalizeDbUrl(process.env.DATABASE_URL ?? "");
  const directUrl = normalizeDbUrl(process.env.DIRECT_URL ?? "");
  if (!directUrl && !databaseUrl) {
    console.error("[seed:mission-hub] DIRECT_URL or DATABASE_URL is not set.");
    process.exit(1);
  }
  if (databaseUrl && directUrl) {
    assertSupabaseUrlRoles(databaseUrl, directUrl);
  }

  const prisma = createPrismaCliClient("seed:mission-hub");
  const cliUrl = directUrl || databaseUrl;
  requireRemoteSeedConfirmation(cliUrl);

  console.log("[seed:mission-hub] DATABASE_URL host:", formatDbTarget(databaseUrl));
  console.log("[seed:mission-hub] DIRECT_URL host:", formatDbTarget(directUrl));
  console.log(
    "[seed:mission-hub] Mode: insert missing slugs only (no updates to existing rows)",
  );

  const existing = await prisma.communitySpaceRecord.findMany({
    select: { slug: true, status: true, title: true },
  });
  const existingBySlug = new Map(existing.map((r) => [r.slug, r]));

  let created = 0;
  let skipped = 0;

  for (const def of DEFAULT_MISSION_HUB_SPACES) {
    const row = existingBySlug.get(def.slug);
    if (row) {
      console.log(
        `[seed:mission-hub] skip ${def.slug} (exists: "${row.title}", status=${row.status})`,
      );
      skipped += 1;
      continue;
    }

    const createdRow = await prisma.communitySpaceRecord.create({
      data: defaultSpaceToCreateInput(def),
      select: { id: true, slug: true, title: true, status: true },
    });
    console.log(
      `[seed:mission-hub] created ${createdRow.slug} (${createdRow.title}, status=${createdRow.status})`,
    );
    created += 1;
  }

  const publishedCount = await prisma.communitySpaceRecord.count({
    where: { status: "published" },
  });

  console.log("[seed:mission-hub] Done.", {
    created,
    skipped,
    publishedSpacesInDb: publishedCount,
  });
  console.log(
    "[seed:mission-hub] Posts are not seeded — publish content in admin or migrate from dev separately.",
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

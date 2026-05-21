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
import { PrismaClient } from "@prisma/client";
import {
  DEFAULT_MISSION_HUB_SPACES,
  defaultSpaceToCreateInput,
} from "./mission-hub-default-spaces";

const prisma = new PrismaClient();

function cleanUrl(url: string | undefined): string {
  return (url ?? "").trim().replace(/^["']|["']$/g, "");
}

function isLocalDatabase(url: string): boolean {
  return /localhost|127\.0\.0\.1/i.test(url);
}

function describeDatabaseTarget(url: string): string {
  try {
    const normalized = url.replace(/^postgresql:\/\//, "http://");
    const u = new URL(normalized);
    const db = u.pathname.replace(/^\//, "") || "(default)";
    return `${u.hostname}:${u.port || "5432"}/${db}`;
  } catch {
    return "(could not parse DATABASE_URL)";
  }
}

function requireRemoteSeedConfirmation(databaseUrl: string): void {
  if (isLocalDatabase(databaseUrl)) return;
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
  const databaseUrl = cleanUrl(process.env.DATABASE_URL);
  if (!databaseUrl) {
    console.error("[seed:mission-hub] DATABASE_URL is not set.");
    process.exit(1);
  }

  requireRemoteSeedConfirmation(databaseUrl);

  console.log("[seed:mission-hub] Target:", describeDatabaseTarget(databaseUrl));
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
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

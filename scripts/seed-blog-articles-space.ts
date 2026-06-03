/**
 * Idempotent production helper — creates Blog Articles space if missing.
 *
 *   npm run db:seed:blog-articles:production
 */
import { buildCompactSpaceCreatePayload } from "../src/lib/community/compact-space-create-payload";
import { spaceFormDataFromInput } from "../src/lib/community/space-form";
import { mergeSpaceSettingsWithNotificationCategory } from "../src/lib/community/space-notification-category";
import { resolveSortOrderForNewSpace } from "../src/lib/community/space-order";
import { createPrismaCliClient } from "./prisma-cli";

async function main(): Promise<void> {
  const prisma = createPrismaCliClient("seed:blog-articles");
  try {
    const payload = buildCompactSpaceCreatePayload({ title: "Blog Articles", icon: "blog" });
    const slug = payload.slug;

    const existing = await prisma.communitySpaceRecord.findUnique({ where: { slug } });
    if (existing) {
      console.log("[seed:blog-articles] already exists:", {
        id: existing.id,
        slug: existing.slug,
        status: existing.status,
        title: existing.title,
      });
      return;
    }

    const sortOrder = await resolveSortOrderForNewSpace(slug);
    const row = await prisma.communitySpaceRecord.create({
      data: {
        ...spaceFormDataFromInput(payload),
        slug,
        sortOrder,
        settings: mergeSpaceSettingsWithNotificationCategory({}, payload.notificationCategory),
      },
    });

    console.log("[seed:blog-articles] created:", {
      id: row.id,
      slug: row.slug,
      status: row.status,
      title: row.title,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

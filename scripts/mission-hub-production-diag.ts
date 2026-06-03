/**
 * Read-only production diagnostics for Mission Hub crash investigation.
 * Usage: dotenv -o -e .env.production -- tsx scripts/mission-hub-production-diag.ts
 */
import { createPrismaCliClient } from "./prisma-cli";

async function main(): Promise<void> {
  const prisma = createPrismaCliClient("mission-hub-diag");

  try {
    const spaces = await prisma.communitySpaceRecord.findMany({
      select: { id: true, slug: true, title: true, status: true },
      orderBy: { sortOrder: "asc" },
    });
    console.log("\n=== SPACES ===");
    console.log(JSON.stringify(spaces, null, 2));

    const notifications = await prisma.communityNotificationRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        dedupeKey: true,
        metadata: true,
        postId: true,
        createdAt: true,
        post: {
          select: {
            id: true,
            status: true,
            sourceKind: true,
            space: { select: { slug: true, status: true } },
          },
        },
      },
    });

    console.log("\n=== NOTIFICATIONS (recent 50) ===");
    for (const n of notifications) {
      const meta =
        n.metadata && typeof n.metadata === "object" && !Array.isArray(n.metadata)
          ? (n.metadata as Record<string, unknown>)
          : null;
      console.log(
        JSON.stringify({
          id: n.id,
          type: n.type,
          dedupeKey: n.dedupeKey,
          sourceKind: meta?.sourceKind ?? null,
          postId: n.postId,
          postExists: Boolean(n.post),
          postSpace: n.post?.space?.slug ?? null,
          postSpaceStatus: n.post?.space?.status ?? null,
          createdAt: n.createdAt.toISOString(),
        }),
      );
    }

    const byType = await prisma.communityNotificationRecord.groupBy({
      by: ["type"],
      _count: { _all: true },
    });
    console.log("\n=== NOTIFICATION TYPE COUNTS ===");
    console.log(JSON.stringify(byType, null, 2));

    const orphanPostRef = await prisma.communityNotificationRecord.findMany({
      where: { postId: { not: null }, post: null },
      select: { id: true, type: true, postId: true },
      take: 20,
    });
    console.log("\n=== NOTIFICATIONS WITH MISSING POST (postId set, join null) ===");
    console.log(JSON.stringify(orphanPostRef, null, 2));

    const blogPosts = await prisma.communityPostRecord.findMany({
      where: {
        OR: [{ sourceKind: "blog" }, { space: { slug: "blog-articles" } }],
      },
      select: {
        id: true,
        status: true,
        sourceKind: true,
        postType: true,
        metadata: true,
        space: { select: { slug: true, status: true } },
      },
    });
    console.log("\n=== BLOG-RELATED POSTS ===");
    console.log(JSON.stringify(blogPosts, null, 2));

    const emailKinds = await prisma.missionHubEmailDeliveryRecord.groupBy({
      by: ["notificationKind"],
      _count: { _all: true },
    });
    console.log("\n=== EMAIL DELIVERY KINDS ===");
    console.log(JSON.stringify(emailKinds, null, 2));

    const malformedSourceKind = await prisma.communityPostRecord.findMany({
      where: {
        sourceKind: { not: null },
        NOT: { sourceKind: { in: ["blog", "newsletter", "post"] } },
      },
      select: { id: true, sourceKind: true, space: { select: { slug: true } } },
      take: 20,
    });
    console.log("\n=== UNEXPECTED sourceKind ON POSTS ===");
    console.log(JSON.stringify(malformedSourceKind, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

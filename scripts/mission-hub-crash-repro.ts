/**
 * Exercise Mission Hub server paths against production DB to surface throws.
 * Usage: dotenv -o -e .env.production -- tsx scripts/mission-hub-crash-repro.ts
 */
import { createPrismaCliClient } from "./prisma-cli";
import { mapNotificationRecordToItem } from "../src/lib/community/notification-record-mapper";

async function main(): Promise<void> {
  const prisma = createPrismaCliClient("mission-hub-crash-repro");

  try {
    const recipientIds = await prisma.communityNotificationRecord.findMany({
      distinct: ["recipientUserId"],
      select: { recipientUserId: true },
      take: 20,
    });

    console.log(`Testing ${recipientIds.length} notification recipients...`);

    for (const { recipientUserId } of recipientIds) {
      if (!recipientUserId) continue;
      const rows = await prisma.communityNotificationRecord.findMany({
        where: { recipientUserId },
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          post: { select: { status: true, space: { select: { slug: true } } } },
        },
      });

      for (const row of rows) {
        const item = mapNotificationRecordToItem(row);
        if (row.type === "newsletter_published" && !item) {
          console.error("MAPPER NULL for newsletter", row.id, row.metadata);
        }
      }

      const unread = rows.filter((r) => !r.readAt).length;
      console.log(`user ${recipientUserId.slice(0, 8)}… rows=${rows.length} unread=${unread}`);
    }

    const spaces = await prisma.communitySpaceRecord.findMany({
      where: { status: "archived" },
      select: { slug: true, title: true },
    });
    console.log("\nArchived spaces:", spaces);

    const postsWithNullSpace = await prisma.communityPostRecord.findMany({
      where: { spaceId: { notIn: (await prisma.communitySpaceRecord.findMany({ select: { id: true } })).map((s) => s.id) } },
      select: { id: true, spaceId: true },
      take: 10,
    });
    console.log("Posts with missing space:", postsWithNullSpace);

    const allNotificationTypes = await prisma.communityNotificationRecord.findMany({
      select: { type: true },
      distinct: ["type"],
    });
    console.log("All notification types in DB:", allNotificationTypes.map((t) => t.type));

    const emailKinds = await prisma.missionHubEmailDeliveryRecord.findMany({
      select: { notificationKind: true },
      distinct: ["notificationKind"],
    });
    console.log("Email notification kinds:", emailKinds.map((k) => k.notificationKind));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});

/**
 * Run Mission Hub query stack against production DB; surfaces any thrown errors.
 * Usage: dotenv -o -e .env.production -- tsx scripts/mission-hub-full-path-test.ts
 */
import { getHubFeedFingerprint } from "../src/lib/community/feed-fingerprint";
import {
  countUnreadNotifications,
  listNotificationsGroupedForUser,
} from "../src/lib/community/notifications";
import { listPublishedPostsBySpaceSlug, listPublishedPostsFeed } from "../src/lib/community/posts";
import {
  getPublishedCommunitySpaceDetailBySlug,
  listPublishedCommunitySpaces,
} from "../src/lib/community/spaces";
import { getPublishedSpacesFingerprint } from "../src/lib/community/spaces-fingerprint";
import { createPrismaCliClient } from "./prisma-cli";

const PRAYER = "prayer-and-praise-room";
const BLOG = "blog-articles";

async function run<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    const result = await fn();
    console.log(`OK  ${label}`);
    return result;
  } catch (error) {
    console.error(`FAIL ${label}`);
    console.error(error);
    return null;
  }
}

async function main(): Promise<void> {
  const prisma = createPrismaCliClient("mission-hub-full-path");

  try {
    await run("listPublishedCommunitySpaces", () => listPublishedCommunitySpaces());
    await run("listPublishedPostsFeed", () => listPublishedPostsFeed(50));
    await run("prayer room space", () => getPublishedCommunitySpaceDetailBySlug(PRAYER));
    await run("prayer room posts", () => listPublishedPostsBySpaceSlug(PRAYER, 10));
    await run("blog-articles space", () => getPublishedCommunitySpaceDetailBySlug(BLOG));
    await run("blog-articles posts", () => listPublishedPostsBySpaceSlug(BLOG, 10));
    await run("feed fingerprint", () => getHubFeedFingerprint(null));
    await run("spaces fingerprint", () => getPublishedSpacesFingerprint());

    const recipients = await prisma.communityNotificationRecord.findMany({
      distinct: ["recipientUserId"],
      select: { recipientUserId: true },
    });

    for (const { recipientUserId } of recipients) {
      if (!recipientUserId) continue;
      await run(`unread ${recipientUserId.slice(0, 8)}`, () =>
        countUnreadNotifications(recipientUserId),
      );
      await run(`grouped ${recipientUserId.slice(0, 8)}`, () =>
        listNotificationsGroupedForUser(recipientUserId),
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});

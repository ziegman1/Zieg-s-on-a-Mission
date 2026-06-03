import "server-only";

import { auth } from "@/auth";
import { getHubFeedFingerprint } from "@/lib/community/feed-fingerprint";
import {
  countUnreadNotifications,
  listNotificationsGroupedForUser,
} from "@/lib/community/notifications";
import { getPublishedSpacesFingerprint } from "@/lib/community/spaces-fingerprint";
import { listPublishedPostsBySpaceSlug, listPublishedPostsFeed } from "@/lib/community/posts";
import {
  getPublishedCommunitySpaceDetailBySlug,
  listPublishedCommunitySpaces,
} from "@/lib/community/spaces";
import {
  logMissionHubDiag,
  missionHubDiagErrorMessage,
} from "@/lib/mission-hub/diagnostics-log";
import { missionHubBuildSha } from "@/lib/community/mission-hub-build-id";
import { prisma } from "@/lib/db";

export type MissionHubHealthError = {
  subsystem: string;
  message: string;
};

export type MissionHubHealthReport = {
  build: string;
  spacesLoaded: boolean;
  notificationsLoaded: boolean;
  feedLoaded: boolean;
  unreadLoaded: boolean;
  prayerRoomLoaded: boolean;
  blogArticlesLoaded: boolean;
  refreshSnapshotLoaded: boolean;
  latestNotificationLoaded: boolean;
  errors: MissionHubHealthError[];
  /** Extra counts for operators */
  counts?: {
    publishedSpaces: number;
    feedPosts: number;
    notificationRows: number;
    unreadCount: number | null;
  };
};

const PRAYER_ROOM_SLUG = "prayer-and-praise-room";
const BLOG_ARTICLES_SLUG = "blog-articles";

async function runCheck(
  subsystem: string,
  errors: MissionHubHealthError[],
  fn: () => Promise<void>,
): Promise<boolean> {
  logMissionHubDiag("health", "start", subsystem);
  try {
    await fn();
    logMissionHubDiag("health", "ok", subsystem);
    return true;
  } catch (error) {
    const message = missionHubDiagErrorMessage(error);
    errors.push({ subsystem, message });
    logMissionHubDiag("health", "error", subsystem, error);
    return false;
  }
}

export async function runMissionHubHealthChecks(): Promise<MissionHubHealthReport> {
  const errors: MissionHubHealthError[] = [];
  let publishedSpaceCount = 0;
  let feedPostCount = 0;
  let notificationRowCount = 0;
  let unreadCount: number | null = null;

  const spacesLoaded = await runCheck("spaces", errors, async () => {
    const spaces = await listPublishedCommunitySpaces();
    publishedSpaceCount = spaces.length;
  });

  const feedLoaded = await runCheck("feed", errors, async () => {
    const posts = await listPublishedPostsFeed(10);
    feedPostCount = posts.length;
  });

  const prayerRoomLoaded = await runCheck("prayer-room", errors, async () => {
    const space = await getPublishedCommunitySpaceDetailBySlug(PRAYER_ROOM_SLUG);
    if (!space) throw new Error(`Space not found: ${PRAYER_ROOM_SLUG}`);
    await listPublishedPostsBySpaceSlug(PRAYER_ROOM_SLUG, 10);
  });

  const blogArticlesLoaded = await runCheck("blog-articles", errors, async () => {
    const space = await getPublishedCommunitySpaceDetailBySlug(BLOG_ARTICLES_SLUG);
    if (!space) throw new Error(`Space not found: ${BLOG_ARTICLES_SLUG}`);
    await listPublishedPostsBySpaceSlug(BLOG_ARTICLES_SLUG, 10);
  });

  let notificationsLoaded = false;
  let unreadLoaded = false;
  let latestNotificationLoaded = false;

  const session = await auth().catch(() => null);
  const userId = session?.user?.id ?? null;

  notificationsLoaded = await runCheck("notifications", errors, async () => {
    const grouped = await listNotificationsGroupedForUser(userId ?? "__health_no_user__", 5).catch(
      () => ({ unread: [], read: [] }),
    );
    notificationRowCount = grouped.unread.length + grouped.read.length;
  });

  if (userId) {
    unreadLoaded = await runCheck("unread-count", errors, async () => {
      unreadCount = await countUnreadNotifications(userId);
    });

    latestNotificationLoaded = await runCheck("latest-notification", errors, async () => {
      await prisma.communityNotificationRecord.findFirst({
        where: { recipientUserId: userId },
        orderBy: { createdAt: "desc" },
        select: { id: true, type: true, createdAt: true },
      });
    });
  } else {
    unreadLoaded = true;
    latestNotificationLoaded = true;
  }

  const refreshSnapshotLoaded = await runCheck("refresh-snapshot", errors, async () => {
    await Promise.all([getHubFeedFingerprint(null), getPublishedSpacesFingerprint()]);
  });

  return {
    build: missionHubBuildSha(),
    spacesLoaded,
    notificationsLoaded,
    feedLoaded,
    unreadLoaded,
    prayerRoomLoaded,
    blogArticlesLoaded,
    refreshSnapshotLoaded,
    latestNotificationLoaded,
    errors,
    counts: {
      publishedSpaces: publishedSpaceCount,
      feedPosts: feedPostCount,
      notificationRows: notificationRowCount,
      unreadCount,
    },
  };
}

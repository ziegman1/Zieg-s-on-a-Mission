"use server";

import { getHubFeedFingerprint } from "@/lib/community/feed-fingerprint";
import { getPublishedSpacesFingerprint } from "@/lib/community/spaces-fingerprint";
import {
  countUnreadNotifications,
  requireNotificationRecipientUserId,
} from "@/lib/community/notifications";
import { advancedNotificationExcludeFilter } from "@/lib/mission-hub/advanced-notifications-config";
import { logMissionHubDiag } from "@/lib/mission-hub/diagnostics-log";
import { prisma } from "@/lib/db";

export type MissionHubRefreshSnapshot = {
  feedVersion: string;
  latestPostId: string | null;
  spacesVersion: string;
  unreadCount: number;
  latestNotificationAt: string | null;
};

const EMPTY_SNAPSHOT: MissionHubRefreshSnapshot = {
  feedVersion: "empty:0",
  latestPostId: null,
  spacesVersion: "0::",
  unreadCount: 0,
  latestNotificationAt: null,
};

/**
 * Lightweight snapshot for Mission Hub polling, PTR, and focus refresh.
 */
export async function fetchMissionHubRefreshSnapshotAction(
  spaceSlug?: string | null,
): Promise<
  { ok: true; snapshot: MissionHubRefreshSnapshot } | { ok: false; error: string }
> {
  logMissionHubDiag("hub-refresh", "start", "fetchMissionHubRefreshSnapshotAction", {
    spaceSlug: spaceSlug ?? null,
  });

  try {
    const [feed, spacesVersion, userId] = await Promise.all([
      getHubFeedFingerprint(spaceSlug ?? null),
      getPublishedSpacesFingerprint(),
      requireNotificationRecipientUserId(),
    ]);

    let unreadCount = 0;
    let latestNotificationAt: string | null = null;

    if (userId) {
      unreadCount = await countUnreadNotifications(userId).catch((e) => {
        logMissionHubDiag("hub-refresh", "error", "unread-count", e);
        return 0;
      });

      try {
        const latestNotification = await prisma.communityNotificationRecord.findFirst({
          where: {
            recipientUserId: userId,
            ...advancedNotificationExcludeFilter(),
          },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });
        latestNotificationAt = latestNotification?.createdAt.toISOString() ?? null;
      } catch (e) {
        logMissionHubDiag("hub-refresh", "error", "latest-notification", e);
      }
    }

    const snapshot = {
      feedVersion: feed.version,
      latestPostId: feed.latestPostId,
      spacesVersion,
      unreadCount,
      latestNotificationAt,
    };
    logMissionHubDiag("hub-refresh", "ok", "fetchMissionHubRefreshSnapshotAction", snapshot);
    return { ok: true, snapshot };
  } catch (e) {
    logMissionHubDiag(
      "hub-refresh",
      "error",
      "fetchMissionHubRefreshSnapshotAction",
      e,
    );
    return { ok: true, snapshot: EMPTY_SNAPSHOT };
  }
}

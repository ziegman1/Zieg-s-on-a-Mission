"use server";

import { getHubFeedFingerprint } from "@/lib/community/feed-fingerprint";
import {
  countUnreadNotifications,
  requireNotificationRecipientUserId,
} from "@/lib/community/notifications";
import { prisma } from "@/lib/db";

export type MissionHubRefreshSnapshot = {
  feedVersion: string;
  latestPostId: string | null;
  unreadCount: number;
  latestNotificationAt: string | null;
};

/**
 * Lightweight snapshot for Mission Hub polling, PTR, and focus refresh.
 */
export async function fetchMissionHubRefreshSnapshotAction(
  spaceSlug?: string | null,
): Promise<
  { ok: true; snapshot: MissionHubRefreshSnapshot } | { ok: false; error: string }
> {
  try {
    const [feed, userId] = await Promise.all([
      getHubFeedFingerprint(spaceSlug ?? null),
      requireNotificationRecipientUserId(),
    ]);

    let unreadCount = 0;
    let latestNotificationAt: string | null = null;

    if (userId) {
      const [count, latestNotification] = await Promise.all([
        countUnreadNotifications(userId),
        prisma.communityNotificationRecord.findFirst({
          where: { recipientUserId: userId },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        }),
      ]);
      unreadCount = count;
      latestNotificationAt = latestNotification?.createdAt.toISOString() ?? null;
    }

    return {
      ok: true,
      snapshot: {
        feedVersion: feed.version,
        latestPostId: feed.latestPostId,
        unreadCount,
        latestNotificationAt,
      },
    };
  } catch (e) {
    console.error("[mission-hub refresh snapshot]", e);
    return { ok: false, error: "Could not refresh Mission Hub" };
  }
}

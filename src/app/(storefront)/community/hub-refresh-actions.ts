"use server";

import { getHubFeedFingerprint } from "@/lib/community/feed-fingerprint";
import { getPublishedSpacesFingerprint } from "@/lib/community/spaces-fingerprint";
import {
  countUnreadNotifications,
  requireNotificationRecipientUserId,
} from "@/lib/community/notifications";
import { prisma } from "@/lib/db";

export type MissionHubRefreshSnapshot = {
  feedVersion: string;
  latestPostId: string | null;
  spacesVersion: string;
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
    const [feed, spacesVersion, userId] = await Promise.all([
      getHubFeedFingerprint(spaceSlug ?? null),
      getPublishedSpacesFingerprint(),
      requireNotificationRecipientUserId(),
    ]);

    let unreadCount = 0;
    let latestNotificationAt: string | null = null;

    if (userId) {
      try {
        unreadCount = await countUnreadNotifications(userId);
      } catch (e) {
        console.error("[mission-hub refresh snapshot] unread count:", e);
      }

      try {
        const latestNotification = await prisma.communityNotificationRecord.findFirst({
          where: { recipientUserId: userId },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        });
        latestNotificationAt = latestNotification?.createdAt.toISOString() ?? null;
      } catch (e) {
        console.error("[mission-hub refresh snapshot] latest notification:", e);
      }
    }

    return {
      ok: true,
      snapshot: {
        feedVersion: feed.version,
        latestPostId: feed.latestPostId,
        spacesVersion,
        unreadCount,
        latestNotificationAt,
      },
    };
  } catch (e) {
    console.error("[mission-hub refresh snapshot]", e);
    return { ok: false, error: "Could not refresh Mission Hub" };
  }
}

import { prisma } from "@/lib/db";
import { newsletterPublishEmailDedupeKey } from "@/lib/mission-hub/email-dedupe";
import { newsletterPublishNotificationDedupeKey } from "./mission-hub-dedupe";
import {
  NEWSLETTER_SOURCE_KIND,
  archiveMissionHubNewsletterAnnouncement,
  type MissionHubNewsletterAnnouncementsResult,
} from "./mission-hub-announcement";

export type RemoveNewsletterFromMissionHubOptions = {
  /** Delete in-app notification rows (resets notification dedupe). Default true. */
  clearNotifications?: boolean;
  /** Delete email delivery log rows (allows resend on next publish). Default true. */
  clearEmailDeliveries?: boolean;
};

export type RemoveNewsletterFromMissionHubResult = {
  postsArchived: number;
  notificationsDeleted: number;
  emailDeliveriesDeleted: number;
};

export type NewsletterMissionHubPostDiagnostic = {
  id: string;
  spaceId: string;
  spaceSlug: string | null;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
};

export type NewsletterMissionHubDiagnostics = {
  newsletterId: string;
  posts: NewsletterMissionHubPostDiagnostic[];
  inAppNotificationCount: number;
  emailDeliveryCount: number;
  emailDeliveryByStatus: Record<string, number>;
  notificationDedupeKey: string;
  emailDedupeKey: string;
};

function isNewsletterHubDebugEnabled(): boolean {
  return (
    process.env.NEWSLETTER_HUB_DEBUG === "1" ||
    process.env.NODE_ENV !== "production"
  );
}

/** Structured publish fan-out log for admin debugging. */
export function logNewsletterPublishFanOut(
  newsletterId: string,
  announcements: MissionHubNewsletterAnnouncementsResult,
  extra?: Record<string, unknown>,
): void {
  if (!isNewsletterHubDebugEnabled()) return;
  console.info("[newsletter] publish fan-out", {
    newsletterId,
    ministryUpdates: {
      postId: announcements.ministryUpdates.postId,
      spaceId: announcements.ministryUpdates.spaceId,
      spaceSlug: announcements.ministryUpdates.spaceSlug,
      created: announcements.ministryUpdates.created,
    },
    newsletterSpace: announcements.newsletterSpace
      ? {
          postId: announcements.newsletterSpace.postId,
          spaceId: announcements.newsletterSpace.spaceId,
          spaceSlug: announcements.newsletterSpace.spaceSlug,
          created: announcements.newsletterSpace.created,
        }
      : { skipped: true, reason: "newsletters space not published or missing" },
    ...extra,
  });
}

/**
 * Remove newsletter presence from Mission Hub without deleting the newsletter record.
 * Archives hub posts and clears delivery dedupe for clean republish testing.
 */
export async function removeNewsletterFromMissionHub(
  newsletterId: string,
  options: RemoveNewsletterFromMissionHubOptions = {},
): Promise<RemoveNewsletterFromMissionHubResult> {
  const clearNotifications = options.clearNotifications !== false;
  const clearEmailDeliveries = options.clearEmailDeliveries !== false;

  const postsArchived = await archiveMissionHubNewsletterAnnouncement(newsletterId);

  let notificationsDeleted = 0;
  if (clearNotifications) {
    const notificationResult = await prisma.communityNotificationRecord.deleteMany({
      where: { dedupeKey: newsletterPublishNotificationDedupeKey(newsletterId) },
    });
    notificationsDeleted = notificationResult.count;
  }

  let emailDeliveriesDeleted = 0;
  if (clearEmailDeliveries) {
    const emailResult = await prisma.missionHubEmailDeliveryRecord.deleteMany({
      where: { dedupeKey: newsletterPublishEmailDedupeKey(newsletterId) },
    });
    emailDeliveriesDeleted = emailResult.count;
  }

  if (isNewsletterHubDebugEnabled()) {
    console.info("[newsletter] removeNewsletterFromMissionHub", {
      newsletterId,
      postsArchived,
      notificationsDeleted,
      emailDeliveriesDeleted,
    });
  }

  return {
    postsArchived,
    notificationsDeleted,
    emailDeliveriesDeleted,
  };
}

/** Admin diagnostics for newsletter Mission Hub delivery state. */
export async function getNewsletterMissionHubDiagnostics(
  newsletterId: string,
): Promise<NewsletterMissionHubDiagnostics> {
  const notificationDedupeKey = newsletterPublishNotificationDedupeKey(newsletterId);
  const emailDedupeKey = newsletterPublishEmailDedupeKey(newsletterId);

  const [posts, inAppNotificationCount, emailRows] = await Promise.all([
    prisma.communityPostRecord.findMany({
      where: {
        sourceKind: NEWSLETTER_SOURCE_KIND,
        sourceId: newsletterId,
      },
      select: {
        id: true,
        spaceId: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        space: { select: { slug: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.communityNotificationRecord.count({
      where: { dedupeKey: notificationDedupeKey },
    }),
    prisma.missionHubEmailDeliveryRecord.findMany({
      where: { dedupeKey: emailDedupeKey },
      select: { status: true },
    }),
  ]);

  const emailDeliveryByStatus: Record<string, number> = {};
  for (const row of emailRows) {
    emailDeliveryByStatus[row.status] = (emailDeliveryByStatus[row.status] ?? 0) + 1;
  }

  return {
    newsletterId,
    posts: posts.map((p) => ({
      id: p.id,
      spaceId: p.spaceId,
      spaceSlug: p.space.slug,
      status: p.status,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      updatedAt: p.updatedAt.toISOString(),
    })),
    inAppNotificationCount,
    emailDeliveryCount: emailRows.length,
    emailDeliveryByStatus,
    notificationDedupeKey,
    emailDedupeKey,
  };
}

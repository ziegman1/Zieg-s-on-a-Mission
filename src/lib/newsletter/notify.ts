import { revalidatePath } from "next/cache";
import {
  deliverNewsletterPublishNotifications,
  formatMissionHubNotificationDeliveryLines,
} from "./member-notifications-prep";
import { logNewsletterPublishFanOut } from "./mission-hub-lifecycle";
import {
  upsertMissionHubNewsletterAnnouncements,
  type MissionHubNewsletterAnnouncementsResult,
  type UpsertMissionHubAnnouncementResult,
} from "./mission-hub-announcement";
import type { NewsletterPublishNotificationsResult } from "./member-notifications-prep";
import type { NewsletterRecord } from "./types";

export type NewsletterNotifyResult = {
  ok: boolean;
  newsletterId: string;
  /** Ministry Updates teaser post. */
  ministryUpdates: UpsertMissionHubAnnouncementResult;
  /** Dedicated Newsletter space post, when that space exists. */
  newsletterSpace: UpsertMissionHubAnnouncementResult | null;
  /** @deprecated Use {@link ministryUpdates}. */
  announcement: UpsertMissionHubAnnouncementResult;
  ministryUpdatesCreated: boolean;
  newsletterSpaceCreated: boolean | null;
  /** @deprecated Use {@link ministryUpdatesCreated}. */
  announcementCreated: boolean;
  notifications: NewsletterPublishNotificationsResult;
  message: string;
};

export type NotifyNewsletterPublishOptions = {
  publisherUserId?: string | null;
  /** When true, resend newsletter publish emails even if already delivered. */
  resendNewsletterEmail?: boolean;
};

function buildNotifyMessage(
  announcements: MissionHubNewsletterAnnouncementsResult,
  notifications: NewsletterPublishNotificationsResult,
): string {
  const parts = [
    announcements.ministryUpdates.created
      ? "Ministry Updates post created."
      : "Ministry Updates post updated.",
  ];
  if (announcements.newsletterSpace) {
    parts.push(
      announcements.newsletterSpace.created
        ? "Newsletter space post created."
        : "Newsletter space post updated.",
    );
  } else {
    parts.push("Newsletter space post skipped (space not found).");
  }
  parts.push(...formatMissionHubNotificationDeliveryLines(notifications));
  return parts.join(" ");
}

/**
 * Mission Hub integration when a newsletter is published from Newsletter Builder.
 * Creates/updates feed announcements in Ministry Updates and the Newsletter space,
 * then creates in-app Mission Hub notifications for eligible members.
 * Full content stays on /newsletters/[slug].
 */
export async function notifyMissionHubMembersOfNewsletterPublish(
  newsletter: NewsletterRecord,
  options: NotifyNewsletterPublishOptions = {},
): Promise<NewsletterNotifyResult> {
  const announcements = await upsertMissionHubNewsletterAnnouncements(
    newsletter,
    options.publisherUserId ?? null,
  );

  const sourcePostId =
    announcements.newsletterSpace?.postId ?? announcements.ministryUpdates.postId;

  const missionHubSpaceSlug =
    announcements.newsletterSpace?.spaceSlug ??
    announcements.ministryUpdates.spaceSlug;

  logNewsletterPublishFanOut(newsletter.id, announcements, {
    sourcePostId,
    missionHubSpaceSlug,
  });

  const notifications = await deliverNewsletterPublishNotifications(newsletter, {
    sourcePostId,
    missionHubSpaceSlug,
    ministryUpdatesPostId: announcements.ministryUpdates.postId,
    ministryUpdatesSpaceSlug: announcements.ministryUpdates.spaceSlug,
    newsletterSpacePostId: announcements.newsletterSpace?.postId ?? null,
    publisherUserId: options.publisherUserId ?? null,
    resendNewsletterEmail: options.resendNewsletterEmail,
  });

  revalidatePath("/community", "page");
  revalidatePath(`/community/${announcements.ministryUpdates.spaceSlug}`, "page");
  if (announcements.newsletterSpace) {
    revalidatePath(`/community/${announcements.newsletterSpace.spaceSlug}`, "page");
  }

  logNewsletterNotifyPlanned(newsletter, announcements, notifications);

  return {
    ok: true,
    newsletterId: newsletter.id,
    ministryUpdates: announcements.ministryUpdates,
    newsletterSpace: announcements.newsletterSpace,
    announcement: announcements.ministryUpdates,
    ministryUpdatesCreated: announcements.ministryUpdates.created,
    newsletterSpaceCreated: announcements.newsletterSpace?.created ?? null,
    announcementCreated: announcements.ministryUpdates.created,
    notifications,
    message: buildNotifyMessage(announcements, notifications),
  };
}

export function logNewsletterNotifyPlanned(
  newsletter: Pick<NewsletterRecord, "id" | "title" | "slug">,
  announcements: MissionHubNewsletterAnnouncementsResult,
  notifications: NewsletterPublishNotificationsResult,
): void {
  if (process.env.NODE_ENV === "production") return;
  console.info("[newsletter] notifyMissionHubMembersOfNewsletterPublish", {
    newsletterId: newsletter.id,
    title: newsletter.title,
    slug: newsletter.slug,
    ministryUpdates: {
      postId: announcements.ministryUpdates.postId,
      spaceSlug: announcements.ministryUpdates.spaceSlug,
      created: announcements.ministryUpdates.created,
    },
    newsletterSpace: announcements.newsletterSpace
      ? {
          postId: announcements.newsletterSpace.postId,
          spaceSlug: announcements.newsletterSpace.spaceSlug,
          created: announcements.newsletterSpace.created,
        }
      : null,
    newsletterPath: announcements.ministryUpdates.newsletterPath,
    notifications: {
      members: notifications.totalMembersWithAccounts,
      inAppSent: notifications.inAppNotificationsSent,
      inAppUpdated: notifications.inAppNotificationsUpdated,
      emailPrepared: notifications.emailRecipientsPrepared,
      emailSent: notifications.emailNotificationsSent,
      emailDeduped: notifications.emailNotificationsDeduped,
      emailFailed: notifications.emailNotificationsFailed,
      emailEnabled: notifications.emailEnabled,
      skipped: notifications.skippedMutedOrDisabled,
    },
  });
}

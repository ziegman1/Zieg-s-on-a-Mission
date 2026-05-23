import { revalidatePath } from "next/cache";
import { prepareNewsletterMemberNotifications } from "./member-notifications-prep";
import {
  upsertMissionHubNewsletterAnnouncement,
  type UpsertMissionHubAnnouncementResult,
} from "./mission-hub-announcement";
import type { NewsletterMemberNotificationsPrep } from "./member-notifications-prep";
import type { NewsletterRecord } from "./types";

export type NewsletterNotifyResult = {
  ok: boolean;
  newsletterId: string;
  announcement: UpsertMissionHubAnnouncementResult;
  announcementCreated: boolean;
  notifications: NewsletterMemberNotificationsPrep;
  message: string;
};

export type NotifyNewsletterPublishOptions = {
  publisherUserId?: string | null;
};

/**
 * Mission Hub integration when a newsletter is published from Newsletter Builder.
 * Creates/updates a feed announcement (teaser + link). Full content stays on /newsletters/[slug].
 * Member email / in-app / push are prepared but not sent yet.
 */
export async function notifyMissionHubMembersOfNewsletterPublish(
  newsletter: NewsletterRecord,
  options: NotifyNewsletterPublishOptions = {},
): Promise<NewsletterNotifyResult> {
  const announcement = await upsertMissionHubNewsletterAnnouncement(
    newsletter,
    options.publisherUserId ?? null,
  );

  const notifications = await prepareNewsletterMemberNotifications(newsletter);

  revalidatePath("/community", "page");
  revalidatePath(`/community/${announcement.spaceSlug}`, "page");

  logNewsletterNotifyPlanned(newsletter, announcement, notifications);

  return {
    ok: true,
    newsletterId: newsletter.id,
    announcement,
    announcementCreated: announcement.created,
    notifications,
    message: announcement.created
      ? "Mission Hub announcement created."
      : "Mission Hub announcement updated.",
  };
}

export function logNewsletterNotifyPlanned(
  newsletter: Pick<NewsletterRecord, "id" | "title" | "slug">,
  announcement: UpsertMissionHubAnnouncementResult,
  notifications: NewsletterMemberNotificationsPrep,
): void {
  if (process.env.NODE_ENV === "production") return;
  console.info("[newsletter] notifyMissionHubMembersOfNewsletterPublish", {
    newsletterId: newsletter.id,
    title: newsletter.title,
    slug: newsletter.slug,
    postId: announcement.postId,
    spaceSlug: announcement.spaceSlug,
    newsletterPath: announcement.newsletterPath,
    notifications: {
      members: notifications.totalMembersWithAccounts,
      email: notifications.emailRecipientsPrepared,
      inApp: notifications.inAppRecipientsPrepared,
      push: notifications.pushRecipientsPrepared,
      skipped: notifications.skippedMutedOrDisabled,
    },
  });
}

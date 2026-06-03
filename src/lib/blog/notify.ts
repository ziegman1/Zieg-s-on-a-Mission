import { revalidatePath } from "next/cache";
import {
  deliverBlogPublishNotifications,
  formatMissionHubNotificationDeliveryLines,
} from "./member-notifications-prep";
import {
  upsertMissionHubBlogAnnouncement,
  type UpsertMissionHubBlogAnnouncementResult,
} from "./mission-hub-announcement";
import type { BlogPublishNotificationsResult } from "./member-notifications-prep";
import type { BlogPostRecord } from "./types";

export type BlogNotifyResult = {
  ok: boolean;
  blogPostId: string;
  announcement: UpsertMissionHubBlogAnnouncementResult;
  announcementCreated: boolean;
  notifications: BlogPublishNotificationsResult;
  message: string;
};

export type NotifyBlogPublishOptions = {
  publisherUserId?: string | null;
  /** When true, resend blog publish emails even if already delivered. */
  resendBlogEmail?: boolean;
  /** Restrict email to TEST_MISSION_HUB_EMAIL_RECIPIENTS; never broadcast in smoke tests. */
  smokeTest?: boolean;
};

function buildNotifyMessage(
  announcement: UpsertMissionHubBlogAnnouncementResult,
  notifications: BlogPublishNotificationsResult,
): string {
  const parts = [
    announcement.created
      ? "Blog Articles post created."
      : "Blog Articles post updated.",
  ];
  parts.push(...formatMissionHubNotificationDeliveryLines(notifications));
  return parts.join(" ");
}

/**
 * Mission Hub integration when a blog article is published from Blog Builder.
 * Creates/updates the announcement post in Blog Articles space,
 * then creates in-app Mission Hub notifications for eligible members.
 * Full content stays on /blog/[slug].
 */
export async function notifyMissionHubMembersOfBlogPublish(
  blog: BlogPostRecord,
  options: NotifyBlogPublishOptions = {},
): Promise<BlogNotifyResult> {
  const announcement = await upsertMissionHubBlogAnnouncement(
    blog,
    options.publisherUserId ?? null,
  );

  const notifications = await deliverBlogPublishNotifications(blog, {
    sourcePostId: announcement.postId,
    missionHubSpaceSlug: announcement.spaceSlug,
    blogArticlesSpaceId: announcement.spaceId,
    publisherUserId: options.publisherUserId ?? null,
    resendBlogEmail: options.resendBlogEmail,
    smokeTest: options.smokeTest === true,
  });

  revalidatePath("/community", "page");
  revalidatePath(`/community/${announcement.spaceSlug}`, "page");

  if (process.env.NODE_ENV !== "production") {
    console.info("[blog] notifyMissionHubMembersOfBlogPublish", {
      blogPostId: blog.id,
      title: blog.title,
      slug: blog.slug,
      announcement: {
        postId: announcement.postId,
        spaceSlug: announcement.spaceSlug,
        created: announcement.created,
      },
      notifications: {
        members: notifications.totalMembersWithAccounts,
        inAppSent: notifications.inAppNotificationsSent,
        inAppUpdated: notifications.inAppNotificationsUpdated,
        emailSent: notifications.emailNotificationsSent,
        emailDeduped: notifications.emailNotificationsDeduped,
      },
    });
  }

  return {
    ok: true,
    blogPostId: blog.id,
    announcement,
    announcementCreated: announcement.created,
    notifications,
    message: buildNotifyMessage(announcement, notifications),
  };
}

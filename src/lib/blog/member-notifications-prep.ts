import { communityPostAnchorPath } from "@/lib/community/post-url";
import { evaluatePostPublishNotificationEligibility } from "@/lib/community/post-notification-preferences";
import {
  buildBlogPublishedNotificationBody,
  upsertBlogPublishedNotification,
} from "@/lib/community/notifications";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
} from "@/lib/community/settings-types";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { prisma } from "@/lib/db";
import {
  getBlogPublishEmailDisabledReason,
  queueAndSendBlogPublishEmail,
} from "@/lib/mission-hub/blog-publish-email";
import { isMissionHubEmailNotificationsEnabled } from "@/lib/mission-hub/email-config";
import { absoluteMissionHubUrl } from "@/lib/mission-hub/site-url";
import {
  isMissionHubEmailDebugEnabled,
  resolveMissionHubEmailSendPolicy,
} from "@/lib/mission-hub/test-email-recipients";
import {
  BLOG_ARTICLES_SPACE_SLUG,
  blogPublicPath,
} from "@/lib/blog/mission-hub-announcement";
import { isMissionHubAdvancedNotificationsEnabled } from "@/lib/mission-hub/advanced-notifications-config";
import type { BlogPostRecord } from "./types";

function skippedBlogPublishNotificationsResult(): BlogPublishNotificationsResult {
  return {
    inAppDelivered: true,
    emailEnabled: false,
    emailDisabledReason: "advanced_notifications_disabled",
    totalMembersWithAccounts: 0,
    inAppNotificationsSent: 0,
    inAppNotificationsUpdated: 0,
    emailNotificationsSent: 0,
    emailNotificationsDeduped: 0,
    emailNotificationsFailed: 0,
    emailNotificationsSkipped: 0,
    emailSkippedNoAddress: 0,
    emailRecipientsPrepared: 0,
    inAppRecipientsPrepared: 0,
    skippedMutedOrDisabled: 0,
    skippedRecipients: [],
    resendMessageIds: [],
  };
}

export type BlogPublishSkipEntry = {
  userId: string;
  email?: string;
  reason: string;
};

export type BlogPublishNotificationsResult = {
  inAppDelivered: true;
  emailEnabled: boolean;
  emailDisabledReason: string | null;
  totalMembersWithAccounts: number;
  inAppNotificationsSent: number;
  inAppNotificationsUpdated: number;
  emailNotificationsSent: number;
  emailNotificationsDeduped: number;
  emailNotificationsFailed: number;
  emailNotificationsSkipped: number;
  emailSkippedNoAddress: number;
  emailRecipientsPrepared: number;
  inAppRecipientsPrepared: number;
  skippedMutedOrDisabled: number;
  skippedRecipients: BlogPublishSkipEntry[];
  resendMessageIds: string[];
};

export type DeliverBlogPublishNotificationsOptions = {
  sourcePostId: string;
  missionHubSpaceSlug: string;
  blogArticlesSpaceId: string;
  publisherUserId?: string | null;
  /** Admin-only: resend emails even when delivery log shows sent. */
  resendBlogEmail?: boolean;
  /** Safe smoke test — email only to TEST_MISSION_HUB_EMAIL_RECIPIENTS. */
  smokeTest?: boolean;
};

/**
 * Delivers Mission Hub blog publish notifications (in-app + optional Resend email).
 * Blog Builder remains source of truth; Mission Hub post is an announcement layer.
 */
export async function deliverBlogPublishNotifications(
  blog: BlogPostRecord,
  options: DeliverBlogPublishNotificationsOptions,
): Promise<BlogPublishNotificationsResult> {
  if (!isMissionHubAdvancedNotificationsEnabled()) {
    return skippedBlogPublishNotificationsResult();
  }

  resolveMissionHubEmailSendPolicy({
    smokeTest: options.smokeTest === true,
  });

  const members = await prisma.communityMemberRecord.findMany({
    where: { status: "active", userId: { not: null } },
    select: {
      userId: true,
      user: { select: { email: true } },
    },
  });

  const userIds = [
    ...new Set(members.map((m) => m.userId).filter((id): id is string => Boolean(id))),
  ];
  const emailByUserId = new Map(
    members
      .filter((m) => m.userId && m.user?.email)
      .map((m) => [m.userId as string, m.user!.email!.trim()]),
  );

  const notificationBody = buildBlogPublishedNotificationBody(blog.excerpt, blog.body);
  const blogPath = blogPublicPath(blog.slug);
  const missionHubPostUrl = absoluteMissionHubUrl(
    communityPostAnchorPath(options.missionHubSpaceSlug, options.sourcePostId),
  );
  const publisherId = options.publisherUserId ?? null;

  const emailEnabled = isMissionHubEmailNotificationsEnabled();
  const emailDisabledReason = getBlogPublishEmailDisabledReason();

  let inAppNotificationsSent = 0;
  let inAppNotificationsUpdated = 0;
  let emailNotificationsSent = 0;
  let emailNotificationsDeduped = 0;
  let emailNotificationsFailed = 0;
  let emailNotificationsSkipped = 0;
  let emailSkippedNoAddress = 0;
  let emailRecipientsPrepared = 0;
  let inAppRecipientsPrepared = 0;
  let skippedMutedOrDisabled = 0;
  const skippedRecipients: BlogPublishSkipEntry[] = [];
  const resendMessageIds: string[] = [];

  for (const userId of userIds) {
    if (publisherId && userId === publisherId) {
      skippedRecipients.push({ userId, reason: "publisher_excluded" });
      continue;
    }

    let prefs = DEFAULT_NOTIFICATION_PREFERENCES;
    try {
      prefs = await getUserNotificationPreferences(userId);
    } catch {
      prefs = mergeNotificationPreferences(null);
    }

    const eligibility = evaluatePostPublishNotificationEligibility(prefs, {
      spaceId: options.blogArticlesSpaceId,
      notificationCategory: "blog_articles",
    });

    if (eligibility.emailChannel) emailRecipientsPrepared += 1;
    if (eligibility.inAppChannel) inAppRecipientsPrepared += 1;

    if (!eligibility.emailChannel && !eligibility.inAppChannel) {
      skippedMutedOrDisabled += 1;
      skippedRecipients.push({
        userId,
        email: emailByUserId.get(userId),
        reason: eligibility.skipReason ?? "all_channels_off",
      });
    }

    if (eligibility.inAppChannel) {
      const outcome = await upsertBlogPublishedNotification({
        recipientUserId: userId,
        blogPostId: blog.id,
        blogSlug: blog.slug,
        blogPath,
        body: notificationBody,
        sourcePostId: options.sourcePostId,
        missionHubSpaceSlug: options.missionHubSpaceSlug,
        actorUserId: publisherId,
      });

      if (outcome === "created") inAppNotificationsSent += 1;
      else inAppNotificationsUpdated += 1;
    }

    if (!eligibility.emailChannel) {
      continue;
    }

    if (!emailEnabled) {
      continue;
    }

    const recipientEmail = emailByUserId.get(userId);
    if (!recipientEmail) {
      emailSkippedNoAddress += 1;
      skippedRecipients.push({ userId, reason: "no_email_address" });
      continue;
    }

    const emailOutcome = await queueAndSendBlogPublishEmail({
      recipientUserId: userId,
      recipientEmail,
      blog,
      missionHubPostUrl,
      forceResend: options.resendBlogEmail === true,
      emailPolicy: { smokeTest: options.smokeTest === true },
    });

    if (emailOutcome.action === "sent") {
      emailNotificationsSent += 1;
      if (emailOutcome.resendMessageId) {
        resendMessageIds.push(emailOutcome.resendMessageId);
      }
    } else if (emailOutcome.action === "deduped") {
      emailNotificationsDeduped += 1;
    } else if (emailOutcome.action === "failed") {
      emailNotificationsFailed += 1;
      skippedRecipients.push({
        userId,
        email: recipientEmail,
        reason: `email_failed:${emailOutcome.error}`,
      });
    } else if (emailOutcome.action === "skipped") {
      emailNotificationsSkipped += 1;
      skippedRecipients.push({
        userId,
        email: recipientEmail,
        reason: emailOutcome.reason,
      });
    }
  }

  if (
    process.env.BLOG_HUB_DEBUG === "1" ||
    isMissionHubEmailDebugEnabled() ||
    process.env.NODE_ENV !== "production"
  ) {
    console.info("[blog] deliverBlogPublishNotifications", {
      blogPostId: blog.id,
      blogArticlesSpaceSlug: BLOG_ARTICLES_SPACE_SLUG,
      blogArticlesSpaceId: options.blogArticlesSpaceId,
      sourcePostId: options.sourcePostId,
      smokeTest: options.smokeTest === true,
      totalMembersWithAccounts: userIds.length,
      inAppNotificationsSent,
      inAppNotificationsUpdated,
      emailNotificationsSent,
      emailNotificationsDeduped,
      emailEnabled,
      skippedMutedOrDisabled,
    });
  }

  return {
    inAppDelivered: true,
    emailEnabled,
    emailDisabledReason,
    totalMembersWithAccounts: userIds.length,
    inAppNotificationsSent,
    inAppNotificationsUpdated,
    emailNotificationsSent,
    emailNotificationsDeduped,
    emailNotificationsFailed,
    emailNotificationsSkipped,
    emailSkippedNoAddress,
    emailRecipientsPrepared,
    inAppRecipientsPrepared,
    skippedMutedOrDisabled,
    skippedRecipients,
    resendMessageIds,
  };
}

export { formatMissionHubNotificationDeliveryLines } from "@/lib/mission-hub/notification-delivery-message";

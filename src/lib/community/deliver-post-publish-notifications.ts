import "server-only";

import { evaluatePostPublishNotificationEligibility } from "@/lib/community/post-notification-preferences";
import { notificationCategoryFromSpaceSettings } from "@/lib/community/space-notification-category";
import {
  upsertNewPostPublishedNotification,
} from "@/lib/community/notifications";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
} from "@/lib/community/settings-types";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { prisma } from "@/lib/db";
import { getNewsletterPublishEmailDisabledReason } from "@/lib/mission-hub/newsletter-publish-email";
import { queueAndSendPostPublishEmail } from "@/lib/mission-hub/post-publish-email";
import { isMissionHubEmailNotificationsEnabled } from "@/lib/mission-hub/email-config";
import {
  isMissionHubEmailDebugEnabled,
  type MissionHubEmailSendPolicy,
} from "@/lib/mission-hub/test-email-recipients";
import { NEWSLETTER_SOURCE_KIND } from "@/lib/newsletter/mission-hub-announcement";

export type PostPublishSkipEntry = {
  userId: string;
  email?: string;
  reason: string;
};

export type DeliverPostPublishNotificationsResult = {
  postId: string;
  spaceId: string;
  spaceSlug: string;
  skippedNewsletterAnnouncement: boolean;
  totalMembersWithAccounts: number;
  inAppNotificationsSent: number;
  inAppNotificationsUpdated: number;
  emailNotificationsSent: number;
  emailNotificationsDeduped: number;
  emailNotificationsFailed: number;
  emailNotificationsSkipped: number;
  emailSkippedNoAddress: number;
  skippedMutedOrDisabled: number;
  skippedRecipients: PostPublishSkipEntry[];
  resendMessageIds: string[];
};

export type DeliverPostPublishNotificationsOptions = {
  authorUserId?: string | null;
  forceResendEmail?: boolean;
  emailPolicy?: MissionHubEmailSendPolicy;
};

/**
 * Notify eligible Mission Hub members when a post is published.
 * Skips newsletter announcement posts (handled by newsletter publish flow).
 */
export async function deliverPostPublishNotifications(
  postId: string,
  options: DeliverPostPublishNotificationsOptions = {},
): Promise<DeliverPostPublishNotificationsResult | null> {
  const post = await prisma.communityPostRecord.findFirst({
    where: { id: postId, status: "published" },
    select: {
      id: true,
      spaceId: true,
      title: true,
      body: true,
      excerpt: true,
      sourceKind: true,
      authorUserId: true,
      space: {
        select: { id: true, slug: true, title: true, status: true, settings: true },
      },
    },
  });

  if (!post || post.space.status !== "published") {
    return null;
  }

  if (post.sourceKind === NEWSLETTER_SOURCE_KIND) {
    return {
      postId: post.id,
      spaceId: post.spaceId,
      spaceSlug: post.space.slug,
      skippedNewsletterAnnouncement: true,
      totalMembersWithAccounts: 0,
      inAppNotificationsSent: 0,
      inAppNotificationsUpdated: 0,
      emailNotificationsSent: 0,
      emailNotificationsDeduped: 0,
      emailNotificationsFailed: 0,
      emailNotificationsSkipped: 0,
      emailSkippedNoAddress: 0,
      skippedMutedOrDisabled: 0,
      skippedRecipients: [],
      resendMessageIds: [],
    };
  }

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

  const authorId = options.authorUserId ?? post.authorUserId ?? null;
  const emailEnabled = isMissionHubEmailNotificationsEnabled();
  const emailDisabledReason = getNewsletterPublishEmailDisabledReason();
  const emailPolicy = options.emailPolicy ?? { smokeTest: false };

  let inAppNotificationsSent = 0;
  let inAppNotificationsUpdated = 0;
  let emailNotificationsSent = 0;
  let emailNotificationsDeduped = 0;
  let emailNotificationsFailed = 0;
  let emailNotificationsSkipped = 0;
  let emailSkippedNoAddress = 0;
  let skippedMutedOrDisabled = 0;
  const skippedRecipients: PostPublishSkipEntry[] = [];
  const resendMessageIds: string[] = [];

  const notificationCategory = notificationCategoryFromSpaceSettings(post.space.settings);

  for (const userId of userIds) {
    if (authorId && userId === authorId) {
      skippedRecipients.push({ userId, reason: "author_excluded" });
      continue;
    }

    let prefs = DEFAULT_NOTIFICATION_PREFERENCES;
    try {
      prefs = await getUserNotificationPreferences(userId);
    } catch {
      prefs = mergeNotificationPreferences(null);
    }

    const eligibility = evaluatePostPublishNotificationEligibility(prefs, {
      spaceId: post.spaceId,
      notificationCategory,
    });

    if (!eligibility.emailChannel && !eligibility.inAppChannel) {
      skippedMutedOrDisabled += 1;
      skippedRecipients.push({
        userId,
        email: emailByUserId.get(userId),
        reason: eligibility.skipReason ?? "all_channels_off",
      });
      continue;
    }

    if (eligibility.inAppChannel) {
      const outcome = await upsertNewPostPublishedNotification({
        recipientUserId: userId,
        postId: post.id,
        spaceId: post.spaceId,
        spaceSlug: post.space.slug,
        spaceName: post.space.title,
        title: post.title,
        body: post.body,
        excerpt: post.excerpt,
        actorUserId: authorId,
      });
      if (outcome === "created") inAppNotificationsSent += 1;
      else inAppNotificationsUpdated += 1;
    }

    if (!eligibility.emailChannel) continue;
    if (!emailEnabled) continue;

    const recipientEmail = emailByUserId.get(userId);
    if (!recipientEmail) {
      emailSkippedNoAddress += 1;
      skippedRecipients.push({ userId, reason: "no_email_address" });
      continue;
    }

    const emailOutcome = await queueAndSendPostPublishEmail({
      recipientUserId: userId,
      recipientEmail,
      postId: post.id,
      spaceId: post.spaceId,
      spaceSlug: post.space.slug,
      spaceName: post.space.title,
      title: post.title,
      body: post.body,
      excerpt: post.excerpt,
      forceResend: options.forceResendEmail === true,
      emailPolicy,
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

  const result: DeliverPostPublishNotificationsResult = {
    postId: post.id,
    spaceId: post.spaceId,
    spaceSlug: post.space.slug,
    skippedNewsletterAnnouncement: false,
    totalMembersWithAccounts: userIds.length,
    inAppNotificationsSent,
    inAppNotificationsUpdated,
    emailNotificationsSent,
    emailNotificationsDeduped,
    emailNotificationsFailed,
    emailNotificationsSkipped,
    emailSkippedNoAddress,
    skippedMutedOrDisabled,
    skippedRecipients,
    resendMessageIds,
  };

  if (isMissionHubEmailDebugEnabled()) {
    console.info("[mission-hub-email] deliverPostPublishNotifications", {
      ...result,
      emailEnabled,
      emailDisabledReason,
      targetSpace: post.space.slug,
      recipientCount: userIds.length,
    });
  }

  return result;
}

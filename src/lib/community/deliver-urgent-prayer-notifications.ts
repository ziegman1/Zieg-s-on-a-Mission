import "server-only";

import { evaluateUrgentPrayerNotificationEligibility } from "@/lib/community/urgent-prayer-notification-preferences";
import {
  buildUrgentPrayerPublishedNotificationBody,
  upsertUrgentPrayerRequestNotification,
} from "@/lib/community/notifications";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
} from "@/lib/community/settings-types";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { prisma } from "@/lib/db";
import { isMissionHubEmailNotificationsEnabled } from "@/lib/mission-hub/email-config";
import { getNewsletterPublishEmailDisabledReason } from "@/lib/mission-hub/newsletter-publish-email";
import { queueAndSendUrgentPrayerEmail } from "@/lib/mission-hub/urgent-prayer-email";
import {
  isMissionHubEmailDebugEnabled,
  type MissionHubEmailSendPolicy,
} from "@/lib/mission-hub/test-email-recipients";
import type { DeliverPostPublishNotificationsOptions } from "./deliver-post-publish-notifications";

export type DeliverUrgentPrayerSkipEntry = {
  userId: string;
  email?: string;
  reason: string;
};

export type DeliverUrgentPrayerNotificationsResult = {
  postId: string;
  spaceId: string;
  spaceSlug: string;
  urgentPrayerRequest: true;
  totalMembersWithAccounts: number;
  inAppNotificationsSent: number;
  inAppNotificationsUpdated: number;
  emailNotificationsSent: number;
  emailNotificationsDeduped: number;
  emailNotificationsFailed: number;
  emailNotificationsSkipped: number;
  emailSkippedNoAddress: number;
  skippedMutedOrDisabled: number;
  skippedRecipients: DeliverUrgentPrayerSkipEntry[];
  resendMessageIds: string[];
};

type UrgentPrayerPostRow = {
  id: string;
  spaceId: string;
  title: string | null;
  body: string;
  excerpt: string | null;
  authorUserId: string | null;
  space: {
    id: string;
    slug: string;
    title: string;
    status: string;
  };
};

/**
 * Dedicated fan-out for urgent prayer request posts.
 * Replaces generic post publish email/in-app notifications.
 */
export async function deliverUrgentPrayerRequestNotifications(
  post: UrgentPrayerPostRow,
  options: DeliverPostPublishNotificationsOptions = {},
): Promise<DeliverUrgentPrayerNotificationsResult> {
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
  const emailPolicy: MissionHubEmailSendPolicy = options.emailPolicy ?? { smokeTest: false };
  const notificationBody = buildUrgentPrayerPublishedNotificationBody(
    post.title,
    post.excerpt,
    post.body,
  );

  let inAppNotificationsSent = 0;
  let inAppNotificationsUpdated = 0;
  let emailNotificationsSent = 0;
  let emailNotificationsDeduped = 0;
  let emailNotificationsFailed = 0;
  let emailNotificationsSkipped = 0;
  let emailSkippedNoAddress = 0;
  let skippedMutedOrDisabled = 0;
  const skippedRecipients: DeliverUrgentPrayerSkipEntry[] = [];
  const resendMessageIds: string[] = [];

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

    const eligibility = evaluateUrgentPrayerNotificationEligibility(prefs, {
      spaceId: post.spaceId,
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
      const outcome = await upsertUrgentPrayerRequestNotification({
        recipientUserId: userId,
        postId: post.id,
        spaceId: post.spaceId,
        spaceSlug: post.space.slug,
        body: notificationBody,
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

    const emailOutcome = await queueAndSendUrgentPrayerEmail({
      recipientUserId: userId,
      recipientEmail,
      postId: post.id,
      spaceId: post.spaceId,
      spaceSlug: post.space.slug,
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

  const result: DeliverUrgentPrayerNotificationsResult = {
    postId: post.id,
    spaceId: post.spaceId,
    spaceSlug: post.space.slug,
    urgentPrayerRequest: true,
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

  if (isMissionHubEmailDebugEnabled() || process.env.NODE_ENV !== "production") {
    console.info("[urgent-prayer] deliverUrgentPrayerRequestNotifications", {
      ...result,
      emailEnabled,
      emailDisabledReason,
    });
  }

  return result;
}

import { communityPostAnchorPath } from "@/lib/community/post-url";
import { evaluateNewsletterNotificationEligibility } from "@/lib/community/notification-preferences";
import {
  buildNewsletterPublishedNotificationBody,
  upsertNewsletterPublishedNotification,
} from "@/lib/community/notifications";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
} from "@/lib/community/settings-types";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { prisma } from "@/lib/db";
import {
  getNewsletterPublishEmailDisabledReason,
  queueAndSendNewsletterPublishEmail,
} from "@/lib/mission-hub/newsletter-publish-email";
import { isMissionHubEmailNotificationsEnabled } from "@/lib/mission-hub/email-config";
import { absoluteMissionHubUrl } from "@/lib/mission-hub/site-url";
import {
  isMissionHubEmailDebugEnabled,
  resolveMissionHubEmailSendPolicy,
} from "@/lib/mission-hub/test-email-recipients";
import {
  NEWSLETTER_SPACE_SLUG,
  newsletterPublicPath,
} from "@/lib/newsletter/mission-hub-announcement";
import type { NewsletterRecord } from "./types";

export type NewsletterPublishSkipEntry = {
  userId: string;
  email?: string;
  reason: string;
};

export type NewsletterPublishNotificationsResult = {
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
  pushRecipientsPrepared: number;
  skippedMutedOrDisabled: number;
  skippedRecipients: NewsletterPublishSkipEntry[];
  resendMessageIds: string[];
};

/** @deprecated Use {@link NewsletterPublishNotificationsResult}. */
export type NewsletterMemberNotificationsPrep = NewsletterPublishNotificationsResult;

export type DeliverNewsletterPublishNotificationsOptions = {
  sourcePostId: string;
  missionHubSpaceSlug: string;
  ministryUpdatesPostId: string;
  ministryUpdatesSpaceSlug: string;
  newsletterSpacePostId?: string | null;
  publisherUserId?: string | null;
  /** Admin-only: resend emails even when delivery log shows sent. */
  resendNewsletterEmail?: boolean;
  /** Safe smoke test — email only to TEST_MISSION_HUB_EMAIL_RECIPIENTS. */
  smokeTest?: boolean;
};

async function resolveNewsletterNotificationSpaceId(): Promise<string | null> {
  const space = await prisma.communitySpaceRecord.findFirst({
    where: { slug: NEWSLETTER_SPACE_SLUG, status: "published" },
    select: { id: true },
  });
  return space?.id ?? null;
}

/**
 * Delivers Mission Hub newsletter publish notifications (in-app + optional Resend email).
 * Newsletter Builder remains source of truth; this is not Mail Suite.
 */
export async function deliverNewsletterPublishNotifications(
  newsletter: NewsletterRecord,
  options: DeliverNewsletterPublishNotificationsOptions,
): Promise<NewsletterPublishNotificationsResult> {
  const emailPolicy = resolveMissionHubEmailSendPolicy({
    smokeTest: options.smokeTest === true,
  });

  const [members, newsletterSpaceId] = await Promise.all([
    prisma.communityMemberRecord.findMany({
      where: { status: "active", userId: { not: null } },
      select: {
        userId: true,
        user: { select: { email: true } },
      },
    }),
    resolveNewsletterNotificationSpaceId(),
  ]);

  const userIds = [
    ...new Set(members.map((m) => m.userId).filter((id): id is string => Boolean(id))),
  ];
  const emailByUserId = new Map(
    members
      .filter((m) => m.userId && m.user?.email)
      .map((m) => [m.userId as string, m.user!.email!.trim()]),
  );

  const notificationBody = buildNewsletterPublishedNotificationBody(
    newsletter.excerpt,
    newsletter.subtitle,
  );
  const newsletterPath = newsletterPublicPath(newsletter.slug);
  const missionHubPostUrl = absoluteMissionHubUrl(
    communityPostAnchorPath(options.missionHubSpaceSlug, options.sourcePostId),
  );
  const publisherId = options.publisherUserId ?? null;

  const emailEnabled = isMissionHubEmailNotificationsEnabled();
  const emailDisabledReason = getNewsletterPublishEmailDisabledReason();

  let inAppNotificationsSent = 0;
  let inAppNotificationsUpdated = 0;
  let emailNotificationsSent = 0;
  let emailNotificationsDeduped = 0;
  let emailNotificationsFailed = 0;
  let emailNotificationsSkipped = 0;
  let emailSkippedNoAddress = 0;
  let emailRecipientsPrepared = 0;
  let inAppRecipientsPrepared = 0;
  let pushRecipientsPrepared = 0;
  let skippedMutedOrDisabled = 0;
  const skippedRecipients: NewsletterPublishSkipEntry[] = [];
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

    const eligibility = evaluateNewsletterNotificationEligibility(prefs, {
      announcementSpaceId: newsletterSpaceId,
      hasMissionHubAccess: true,
    });

    if (eligibility.emailChannel) emailRecipientsPrepared += 1;
    if (eligibility.inAppChannel) inAppRecipientsPrepared += 1;
    if (eligibility.pushChannel) pushRecipientsPrepared += 1;

    if (
      !eligibility.emailChannel &&
      !eligibility.inAppChannel &&
      !eligibility.pushChannel
    ) {
      skippedMutedOrDisabled += 1;
      skippedRecipients.push({
        userId,
        email: emailByUserId.get(userId),
        reason: eligibility.skipReason ?? "all_channels_off",
      });
    }

    if (eligibility.inAppChannel) {
      const outcome = await upsertNewsletterPublishedNotification({
        recipientUserId: userId,
        newsletterId: newsletter.id,
        newsletterSlug: newsletter.slug,
        newsletterPath,
        body: notificationBody,
        sourcePostId: options.sourcePostId,
        missionHubSpaceSlug: options.missionHubSpaceSlug,
        ministryUpdatesPostId: options.ministryUpdatesPostId,
        ministryUpdatesSpaceSlug: options.ministryUpdatesSpaceSlug,
        newsletterSpacePostId: options.newsletterSpacePostId,
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

    const emailOutcome = await queueAndSendNewsletterPublishEmail({
      recipientUserId: userId,
      recipientEmail,
      newsletter,
      missionHubPostUrl,
      forceResend: options.resendNewsletterEmail === true,
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
    process.env.NEWSLETTER_HUB_DEBUG === "1" ||
    isMissionHubEmailDebugEnabled() ||
    process.env.NODE_ENV !== "production"
  ) {
    console.info("[newsletter] deliverNewsletterPublishNotifications", {
      newsletterId: newsletter.id,
      newsletterSpaceSlug: NEWSLETTER_SPACE_SLUG,
      newsletterSpaceId,
      sourcePostId: options.sourcePostId,
      smokeTest: options.smokeTest === true,
      eligibleUserIds: userIds.filter((id) => !publisherId || id !== publisherId),
      totalMembersWithAccounts: userIds.length,
      inAppNotificationsSent,
      inAppNotificationsUpdated,
      inAppRecipientsPrepared,
      emailNotificationsSent,
      emailNotificationsDeduped,
      emailNotificationsFailed,
      emailNotificationsSkipped,
      emailRecipientsPrepared,
      emailEnabled,
      emailDisabledReason,
      skippedMutedOrDisabled,
      resendMessageIds,
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
    pushRecipientsPrepared,
    skippedMutedOrDisabled,
    skippedRecipients,
    resendMessageIds,
  };
}

/** @deprecated Use {@link deliverNewsletterPublishNotifications}. */
export const sendNewsletterPublishInAppNotifications = deliverNewsletterPublishNotifications;

/** @deprecated Use {@link deliverNewsletterPublishNotifications}. */
export const prepareNewsletterMemberNotifications = deliverNewsletterPublishNotifications;

export { formatMissionHubNotificationDeliveryLines } from "@/lib/mission-hub/notification-delivery-message";

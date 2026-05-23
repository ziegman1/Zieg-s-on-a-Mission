import { evaluateNewsletterNotificationEligibility } from "@/lib/community/notification-preferences";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
} from "@/lib/community/settings-types";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { NEWSLETTER_ANNOUNCEMENT_SPACE_SLUG } from "@/lib/newsletter/mission-hub-announcement";
import { prisma } from "@/lib/db";
import type { NewsletterRecord } from "./types";

export type NewsletterMemberNotificationsPrep = {
  prepared: true;
  deliveryEnabled: false;
  totalMembersWithAccounts: number;
  emailRecipientsPrepared: number;
  inAppRecipientsPrepared: number;
  pushRecipientsPrepared: number;
  skippedMutedOrDisabled: number;
};

async function resolveAnnouncementSpaceId(): Promise<string | null> {
  const space = await prisma.communitySpaceRecord.findFirst({
    where: { slug: NEWSLETTER_ANNOUNCEMENT_SPACE_SLUG, status: "published" },
    select: { id: true },
  });
  return space?.id ?? null;
}

/**
 * Counts Mission Hub members who would receive newsletter publish notifications per channel.
 * Respects newsletters, ministry updates, channel toggles, and muted spaces.
 * Does not send email, in-app, or push yet.
 */
export async function prepareNewsletterMemberNotifications(
  _newsletter: NewsletterRecord,
): Promise<NewsletterMemberNotificationsPrep> {
  const [members, announcementSpaceId] = await Promise.all([
    prisma.communityMemberRecord.findMany({
      where: { status: "active", userId: { not: null } },
      select: { userId: true },
    }),
    resolveAnnouncementSpaceId(),
  ]);

  const userIds = [
    ...new Set(members.map((m) => m.userId).filter((id): id is string => Boolean(id))),
  ];

  let emailRecipientsPrepared = 0;
  let inAppRecipientsPrepared = 0;
  let pushRecipientsPrepared = 0;
  let skippedMutedOrDisabled = 0;

  for (const userId of userIds) {
    let prefs = DEFAULT_NOTIFICATION_PREFERENCES;
    try {
      prefs = await getUserNotificationPreferences(userId);
    } catch {
      prefs = mergeNotificationPreferences(null);
    }

    const eligibility = evaluateNewsletterNotificationEligibility(prefs, {
      announcementSpaceId,
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
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[newsletter] prepareNewsletterMemberNotifications", {
      totalMembersWithAccounts: userIds.length,
      emailRecipientsPrepared,
      inAppRecipientsPrepared,
      pushRecipientsPrepared,
      skippedMutedOrDisabled,
      deliveryEnabled: false,
    });
  }

  return {
    prepared: true,
    deliveryEnabled: false,
    totalMembersWithAccounts: userIds.length,
    emailRecipientsPrepared,
    inAppRecipientsPrepared,
    pushRecipientsPrepared,
    skippedMutedOrDisabled,
  };
}

import { memberWantsWeeklyDigest } from "@/lib/community/notification-preferences";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/community/settings-types";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { prisma } from "@/lib/db";

export type WeeklyDigestRecipient = {
  userId: string;
  email: string;
};

export function isWeeklyDigestEmailEligible(
  prefs: NotificationPreferences,
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim();
  if (!normalized) return false;
  return memberWantsWeeklyDigest(prefs);
}

async function resolveMemberPrefs(userId: string): Promise<NotificationPreferences> {
  try {
    return await getUserNotificationPreferences(userId);
  } catch {
    return mergeNotificationPreferences(null);
  }
}

/** Active members with linked accounts, valid email, and weekly digest email enabled. */
export async function listWeeklyDigestEmailRecipients(): Promise<WeeklyDigestRecipient[]> {
  const members = await prisma.communityMemberRecord.findMany({
    where: { status: "active", userId: { not: null } },
    select: {
      userId: true,
      user: { select: { email: true } },
    },
  });

  const recipients: WeeklyDigestRecipient[] = [];
  const seen = new Set<string>();

  for (const member of members) {
    const userId = member.userId;
    if (!userId || seen.has(userId)) continue;
    seen.add(userId);

    const email = member.user?.email?.trim();
    if (!email) continue;

    const prefs = await resolveMemberPrefs(userId);
    if (!isWeeklyDigestEmailEligible(prefs, email)) continue;

    recipients.push({ userId, email });
  }

  return recipients;
}

/** Count members who would receive a weekly digest email when delivery is enabled. */
export async function countWeeklyDigestEmailRecipients(): Promise<number> {
  const recipients = await listWeeklyDigestEmailRecipients();
  return recipients.length;
}

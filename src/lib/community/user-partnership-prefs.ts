import {
  applyPartnershipToNotificationPreferences,
  mergePartnershipPreferences,
  type PartnershipPreferences,
} from "@/lib/community/partnership-preferences";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { saveMissionHubNotificationPreferences } from "@/lib/mission-hub/mission-hub-email-preferences";
import { recordNotificationPreferenceEvent } from "@/lib/mission-hub/notification-preference-events";
import { prisma } from "@/lib/db";

export async function getUserPartnershipPreferences(
  userId: string,
): Promise<PartnershipPreferences | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { communityEngagementPrefs: true },
  });
  return mergePartnershipPreferences(user?.communityEngagementPrefs);
}

export async function userNeedsPartnershipOnboarding(userId: string): Promise<boolean> {
  const prefs = await getUserPartnershipPreferences(userId);
  return prefs?.onboardingCompletedAt == null;
}

export async function saveUserPartnershipPreferences(
  userId: string,
  prefs: PartnershipPreferences,
): Promise<void> {
  const previous = await getUserNotificationPreferences(userId);
  const synced = applyPartnershipToNotificationPreferences(prefs, previous);

  await prisma.user.update({
    where: { id: userId },
    data: { communityEngagementPrefs: prefs },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (user?.email?.trim()) {
    const email = user.email.trim();
    const next = await saveMissionHubNotificationPreferences({
      userId,
      email,
      prefs: synced,
      actorType: "user",
      actorUserId: userId,
      metadata: { source: "partnership_onboarding" },
    });
    await recordNotificationPreferenceEvent({
      userId,
      email,
      eventType: "partnership_prefs_synced",
      actorType: "user",
      actorUserId: userId,
      previousPrefs: previous,
      nextPrefs: next,
      metadata: { source: "partnership_onboarding" },
    });
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { communityNotificationPrefs: synced },
  });
}

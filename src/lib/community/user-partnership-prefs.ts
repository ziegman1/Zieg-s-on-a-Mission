import {
  applyPartnershipToNotificationPreferences,
  mergePartnershipPreferences,
  type PartnershipPreferences,
} from "@/lib/community/partnership-preferences";
import {
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
} from "@/lib/community/user-notification-prefs";
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
  const notification = await getUserNotificationPreferences(userId);
  const synced = applyPartnershipToNotificationPreferences(prefs, notification);

  await prisma.user.update({
    where: { id: userId },
    data: {
      communityEngagementPrefs: prefs,
      communityNotificationPrefs: synced,
    },
  });
}

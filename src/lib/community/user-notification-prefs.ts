import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/community/settings-types";
import { prisma } from "@/lib/db";

export async function getUserNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { communityNotificationPrefs: true },
  });
  return mergeNotificationPreferences(user?.communityNotificationPrefs);
}

export async function updateUserNotificationPreferences(
  userId: string,
  prefs: NotificationPreferences,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { communityNotificationPrefs: prefs },
  });
}

export { DEFAULT_NOTIFICATION_PREFERENCES };

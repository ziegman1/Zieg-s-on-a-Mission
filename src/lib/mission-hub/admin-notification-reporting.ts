import "server-only";

import { mergeNotificationPreferences } from "@/lib/community/settings-types";
import {
  memberUsesDailyDigest,
  memberUsesWeeklyDigestCategories,
} from "@/lib/mission-hub/notification-category-preferences";
import {
  countMissionHubEmailSuppressions,
  normalizeSuppressionEmail,
} from "@/lib/mission-hub/email-suppressions";
import { prisma } from "@/lib/db";

export type MissionHubNotificationAdminStats = {
  emailEnabled: number;
  digestUsers: number;
  dailyDigestUsers: number;
  weeklyDigestUsers: number;
  unsubscribedUsers: number;
};

export async function loadMissionHubNotificationAdminStats(): Promise<MissionHubNotificationAdminStats> {
  const [users, suppressions] = await Promise.all([
    prisma.user.findMany({
      where: { communityMember: { is: { status: "active" } } },
      select: { email: true, communityNotificationPrefs: true },
    }),
    prisma.emailSuppressionRecord.findMany({
      where: { scope: { in: ["mission_hub", "all"] } },
      select: { email: true },
    }),
  ]);

  const suppressedEmails = new Set(
    suppressions.map((row) => normalizeSuppressionEmail(row.email)),
  );

  let emailEnabled = 0;
  let digestUsers = 0;
  let dailyDigestUsers = 0;
  let weeklyDigestUsers = 0;
  let unsubscribedUsers = 0;

  for (const user of users) {
    const email = user.email?.trim().toLowerCase();
    const prefs = mergeNotificationPreferences(user.communityNotificationPrefs);
    const suppressed = email ? suppressedEmails.has(email) : false;

    if (suppressed || prefs.email === false) {
      unsubscribedUsers += 1;
      continue;
    }

    if (prefs.email) emailEnabled += 1;
    if (memberUsesDailyDigest(prefs)) dailyDigestUsers += 1;
    if (memberUsesWeeklyDigestCategories(prefs)) weeklyDigestUsers += 1;
    if (memberUsesDailyDigest(prefs) || memberUsesWeeklyDigestCategories(prefs)) {
      digestUsers += 1;
    }
  }

  return {
    emailEnabled,
    digestUsers,
    dailyDigestUsers,
    weeklyDigestUsers,
    unsubscribedUsers,
  };
}

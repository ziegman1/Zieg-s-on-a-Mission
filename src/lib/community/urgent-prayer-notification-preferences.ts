import type { NotificationPreferences } from "@/lib/community/settings-types";
import {
  wantsImmediateEmailForCategory,
} from "@/lib/mission-hub/notification-category-preferences";

export type UrgentPrayerSkipReason =
  | "space_muted"
  | "prayer_and_new_posts_disabled"
  | "all_channels_off";

export type UrgentPrayerNotificationEligibility = {
  emailChannel: boolean;
  inAppChannel: boolean;
  spaceMuted: boolean;
  skipReason: UrgentPrayerSkipReason | null;
};

/**
 * Urgent prayer emails go to members with prayerResponses OR newPosts enabled,
 * plus global email/in-app channel prefs. Muted Prayer Room users are excluded.
 */
export function evaluateUrgentPrayerNotificationEligibility(
  prefs: NotificationPreferences,
  options: { spaceId: string },
): UrgentPrayerNotificationEligibility {
  const muted = new Set(prefs.mutedSpaceIds ?? []);
  if (muted.has(options.spaceId)) {
    return {
      emailChannel: false,
      inAppChannel: false,
      spaceMuted: true,
      skipReason: "space_muted",
    };
  }

  const wantsPrayer = prefs.prayerResponses !== false;
  const wantsNewPosts = prefs.newPosts !== false;
  const wantsContent = wantsPrayer || wantsNewPosts;
  if (!wantsContent) {
    return {
      emailChannel: false,
      inAppChannel: false,
      spaceMuted: false,
      skipReason: "prayer_and_new_posts_disabled",
    };
  }

  const emailChannel =
    (wantsPrayer && wantsImmediateEmailForCategory(prefs, "prayerRequests")) ||
    (wantsNewPosts && wantsImmediateEmailForCategory(prefs, "communityActivity"));
  const inAppChannel = wantsContent && prefs.inApp === true;

  if (!emailChannel && !inAppChannel) {
    return {
      emailChannel: false,
      inAppChannel: false,
      spaceMuted: false,
      skipReason: "all_channels_off",
    };
  }

  return {
    emailChannel,
    inAppChannel,
    spaceMuted: false,
    skipReason: null,
  };
}

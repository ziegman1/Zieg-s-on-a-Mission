import type { NotificationPreferences } from "@/lib/community/settings-types";

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

  const wantsContent = prefs.prayerResponses !== false || prefs.newPosts !== false;
  if (!wantsContent) {
    return {
      emailChannel: false,
      inAppChannel: false,
      spaceMuted: false,
      skipReason: "prayer_and_new_posts_disabled",
    };
  }

  const emailChannel = wantsContent && prefs.email === true;
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

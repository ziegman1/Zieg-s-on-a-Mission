import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/lib/community/settings-types";
import {
  DEFAULT_SPACE_NOTIFICATION_CATEGORY,
  memberWantsCategoryNotification,
  notificationPreferenceKeyForCategory,
  type SpaceNotificationCategory,
} from "@/lib/community/space-notification-category";

export type PostNotificationSkipReason =
  | "new_posts_disabled"
  | "ministry_updates_disabled"
  | "newsletters_disabled"
  | "prayer_responses_disabled"
  | "praise_reports_disabled"
  | "space_muted"
  | "all_channels_off";

export type PostNotificationEligibility = {
  emailChannel: boolean;
  inAppChannel: boolean;
  spaceMuted: boolean;
  /** Preference key evaluated for this space category */
  preferenceKey: ReturnType<typeof notificationPreferenceKeyForCategory>;
  skipReason: PostNotificationSkipReason | null;
};

function skipReasonWhenPreferenceOff(
  category: SpaceNotificationCategory,
): PostNotificationSkipReason {
  switch (category) {
    case "ministry_updates":
      return "ministry_updates_disabled";
    case "newsletters":
      return "newsletters_disabled";
    case "prayer_requests":
      return "prayer_responses_disabled";
    case "praise_reports":
      return "praise_reports_disabled";
    case "blog_articles":
    case "resources":
    case "custom":
    default:
      return "new_posts_disabled";
  }
}

export function evaluatePostPublishNotificationEligibility(
  prefs: NotificationPreferences,
  options: {
    spaceId: string;
    notificationCategory?: SpaceNotificationCategory;
  },
): PostNotificationEligibility {
  const category = options.notificationCategory ?? DEFAULT_SPACE_NOTIFICATION_CATEGORY;
  const preferenceKey = notificationPreferenceKeyForCategory(category);
  const muted = new Set(prefs.mutedSpaceIds ?? []);
  const spaceMuted = muted.has(options.spaceId);

  if (spaceMuted) {
    return {
      emailChannel: false,
      inAppChannel: false,
      spaceMuted: true,
      preferenceKey,
      skipReason: "space_muted",
    };
  }

  const wantsContent = memberWantsCategoryNotification(prefs, category);
  const emailChannel = wantsContent && prefs.email === true;
  const inAppChannel = wantsContent && prefs.inApp === true;

  let skipReason: PostNotificationSkipReason | null = null;
  if (!wantsContent) {
    skipReason = skipReasonWhenPreferenceOff(category);
  } else if (!emailChannel && !inAppChannel) {
    skipReason = "all_channels_off";
  }

  return {
    emailChannel,
    inAppChannel,
    spaceMuted: false,
    preferenceKey,
    skipReason,
  };
}

export { DEFAULT_NOTIFICATION_PREFERENCES };

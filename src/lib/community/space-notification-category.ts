import type { CommunitySpaceSettings, NotificationPreferences } from "@/lib/community/settings-types";
import { mergeSpaceSettings } from "@/lib/community/settings-types";
import {
  categoryFrequency,
  spaceCategoryToEmailCategory,
} from "@/lib/mission-hub/notification-category-preferences";
import {
  DEFAULT_SPACE_NOTIFICATION_CATEGORY,
  SPACE_NOTIFICATION_CATEGORIES,
  SPACE_NOTIFICATION_CATEGORY_VALUES,
  parseSpaceNotificationCategory,
  type SpaceNotificationCategory,
} from "@/lib/community/space-notification-category-values";

export {
  DEFAULT_SPACE_NOTIFICATION_CATEGORY,
  SPACE_NOTIFICATION_CATEGORIES,
  SPACE_NOTIFICATION_CATEGORY_VALUES,
  parseSpaceNotificationCategory,
  type SpaceNotificationCategory,
};

export function notificationCategoryFromSpaceSettings(
  settings: unknown,
): SpaceNotificationCategory {
  if (!settings || typeof settings !== "object") {
    return DEFAULT_SPACE_NOTIFICATION_CATEGORY;
  }
  return parseSpaceNotificationCategory(
    (settings as Record<string, unknown>).notificationCategory,
  );
}

export function mergeSpaceSettingsWithNotificationCategory(
  existing: unknown,
  notificationCategory: SpaceNotificationCategory,
): CommunitySpaceSettings {
  return {
    ...mergeSpaceSettings(existing),
    notificationCategory,
  };
}

/** User preference key used when a post is published in a space with this category. */
export type CategoryNotificationPrefKey =
  | "ministryUpdates"
  | "newsletters"
  | "prayerResponses"
  | "praiseReports"
  | "newPosts";

export function notificationPreferenceKeyForCategory(
  category: SpaceNotificationCategory,
): CategoryNotificationPrefKey {
  switch (category) {
    case "ministry_updates":
      return "ministryUpdates";
    case "newsletters":
      return "newsletters";
    case "prayer_requests":
      return "prayerResponses";
    case "praise_reports":
      return "praiseReports";
    case "blog_articles":
    case "resources":
    case "custom":
    default:
      return "newPosts";
  }
}

/** True when the member has not turned off the pref mapped to this space category. */
export function memberWantsCategoryNotification(
  prefs: NotificationPreferences,
  category: SpaceNotificationCategory,
): boolean {
  const emailCategory = spaceCategoryToEmailCategory(category);
  return categoryFrequency(prefs, emailCategory) !== "never";
}

export { spaceCategoryToEmailCategory };

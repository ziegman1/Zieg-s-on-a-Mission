import type { CommunitySpaceSettings } from "@/lib/community/settings-types";
import { mergeSpaceSettings } from "@/lib/community/settings-types";
import type { NotificationPreferences } from "@/lib/community/settings-types";

export const SPACE_NOTIFICATION_CATEGORY_VALUES = [
  "ministry_updates",
  "newsletters",
  "prayer_requests",
  "praise_reports",
  "blog_articles",
  "resources",
  "custom",
] as const;

export type SpaceNotificationCategory = (typeof SPACE_NOTIFICATION_CATEGORY_VALUES)[number];

export const SPACE_NOTIFICATION_CATEGORIES: {
  value: SpaceNotificationCategory;
  label: string;
}[] = [
  { value: "ministry_updates", label: "Ministry Updates" },
  { value: "newsletters", label: "Newsletters" },
  { value: "prayer_requests", label: "Prayer Requests" },
  { value: "praise_reports", label: "Praise Reports" },
  { value: "blog_articles", label: "Blog Articles" },
  { value: "resources", label: "Resources" },
  { value: "custom", label: "Custom" },
];

export const DEFAULT_SPACE_NOTIFICATION_CATEGORY: SpaceNotificationCategory = "custom";

const CATEGORY_SET = new Set<string>(SPACE_NOTIFICATION_CATEGORY_VALUES);

export function parseSpaceNotificationCategory(
  value: unknown,
): SpaceNotificationCategory {
  if (typeof value === "string" && CATEGORY_SET.has(value)) {
    return value as SpaceNotificationCategory;
  }
  return DEFAULT_SPACE_NOTIFICATION_CATEGORY;
}

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
  const key = notificationPreferenceKeyForCategory(category);
  return prefs[key] !== false;
}

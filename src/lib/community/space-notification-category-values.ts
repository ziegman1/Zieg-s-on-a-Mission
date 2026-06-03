/** Notification category enum — no imports from settings-types (avoids circular deps). */

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

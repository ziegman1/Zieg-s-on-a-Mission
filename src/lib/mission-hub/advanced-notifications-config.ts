import {
  BLOG_PUBLISHED_NOTIFICATION_TYPE,
  URGENT_PRAYER_REQUEST_NOTIFICATION_TYPE,
} from "@/lib/community/notification-type-constants";

/** Notification kinds introduced with blog + urgent prayer fan-out. */
export const ADVANCED_NOTIFICATION_TYPES = [
  BLOG_PUBLISHED_NOTIFICATION_TYPE,
  URGENT_PRAYER_REQUEST_NOTIFICATION_TYPE,
] as const;

export type AdvancedNotificationType = (typeof ADVANCED_NOTIFICATION_TYPES)[number];

const ADVANCED_TYPE_SET = new Set<string>(ADVANCED_NOTIFICATION_TYPES);

/**
 * Emergency stabilization flag — default off unless explicitly enabled in env.
 * When false: hide advanced in-app rows, skip fan-out/email, never crash on legacy rows.
 */
export function isMissionHubAdvancedNotificationsEnabled(): boolean {
  return process.env.MISSION_HUB_ADVANCED_NOTIFICATIONS_ENABLED === "true";
}

export function isAdvancedNotificationType(type: string): type is AdvancedNotificationType {
  return ADVANCED_TYPE_SET.has(type);
}

/** True when a notification row should be shown or counted for the user. */
export function shouldIncludeAdvancedNotificationType(type: string): boolean {
  if (!isAdvancedNotificationType(type)) return true;
  return isMissionHubAdvancedNotificationsEnabled();
}

/** Prisma filter fragment — exclude advanced types when the flag is off. */
export function advancedNotificationExcludeFilter():
  | { type: { notIn: AdvancedNotificationType[] } }
  | Record<string, never> {
  if (isMissionHubAdvancedNotificationsEnabled()) return {};
  return { type: { notIn: [...ADVANCED_NOTIFICATION_TYPES] } };
}

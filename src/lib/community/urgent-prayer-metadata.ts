import { isPrayerSpaceSlug } from "@/lib/community/space-interaction";
import {
  notificationCategoryFromSpaceSettings,
  type SpaceNotificationCategory,
} from "@/lib/community/space-notification-category";

export type UrgentPrayerPostMetadata = {
  urgentPrayerRequest: true;
};

export function buildUrgentPrayerPostMetadata(): UrgentPrayerPostMetadata {
  return { urgentPrayerRequest: true };
}

export function isUrgentPrayerRequest(metadata: unknown): boolean {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return false;
  return (metadata as Record<string, unknown>).urgentPrayerRequest === true;
}

export function canShowUrgentPrayerRequestOption(input: {
  spaceSlug: string;
  notificationCategory?: SpaceNotificationCategory;
  postType: string;
}): boolean {
  if (input.notificationCategory === "prayer_requests") return true;
  if (isPrayerSpaceSlug(input.spaceSlug)) return true;
  if (input.postType === "prayer") return true;
  return false;
}

export function isUrgentPrayerRequestAllowed(input: {
  spaceSlug: string;
  settings: unknown;
  postType: string;
}): boolean {
  const category = notificationCategoryFromSpaceSettings(input.settings);
  return canShowUrgentPrayerRequestOption({
    spaceSlug: input.spaceSlug,
    notificationCategory: category,
    postType: input.postType,
  });
}

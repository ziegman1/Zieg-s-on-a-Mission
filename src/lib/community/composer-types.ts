/** Space row for in-app owner create post composer (all statuses). */
import type { SpaceNotificationCategory } from "@/lib/community/space-notification-category-values";

export type CommunityComposerSpace = {
  id: string;
  title: string;
  slug: string;
  status: string;
  notificationCategory?: SpaceNotificationCategory;
};

export function publishedComposerSpaces(
  spaces: CommunityComposerSpace[],
): CommunityComposerSpace[] {
  return spaces.filter((s) => s.status === "published");
}

/** Preselect space: explicit default → only published space → first published. */
export function resolveComposerSpaceId(
  spaces: CommunityComposerSpace[],
  defaultSpaceId?: string,
): string {
  const published = publishedComposerSpaces(spaces);
  if (defaultSpaceId && published.some((s) => s.id === defaultSpaceId)) {
    return defaultSpaceId;
  }
  if (published.length === 1) return published[0].id;
  if (published.length > 0) return published[0].id;
  return "";
}

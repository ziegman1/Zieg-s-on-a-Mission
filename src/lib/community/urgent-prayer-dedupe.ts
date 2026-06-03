/** In-app notification dedupe for urgent prayer request publish (per recipient). */
export function urgentPrayerPublishNotificationDedupeKey(postId: string): string {
  return `urgent-prayer:${postId}:published`;
}

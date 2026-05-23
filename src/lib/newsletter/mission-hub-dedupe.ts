/** In-app notification dedupe for newsletter publish (per recipient). */
export function newsletterPublishNotificationDedupeKey(newsletterId: string): string {
  return `newsletter:${newsletterId}:published`;
}

/** In-app notification dedupe for newsletter publish (per recipient). */
export function newsletterPublishNotificationDedupeKey(newsletterId: string): string {
  return `newsletter:${newsletterId}:published`;
}

/** In-app notification dedupe for a published Mission Hub post. */
export function newPostPublishNotificationDedupeKey(postId: string): string {
  return `post:${postId}:published`;
}

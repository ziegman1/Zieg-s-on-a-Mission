/** In-app notification dedupe for blog publish (per recipient). */
export function blogPublishNotificationDedupeKey(blogPostId: string): string {
  return `blog:${blogPostId}:published`;
}

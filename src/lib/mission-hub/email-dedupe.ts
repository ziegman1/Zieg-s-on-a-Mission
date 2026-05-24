/** Dedupe keys for Mission Hub email delivery log (one row per recipient per key). */

export type MissionHubEmailNotificationKind =
  | "newsletter_published"
  | "post_published"
  | "new_post"
  | "weekly_digest"
  | "invitation";

export function newsletterPublishEmailDedupeKey(newsletterId: string): string {
  return `newsletter:${newsletterId}:email`;
}

export function postPublishEmailDedupeKey(postId: string): string {
  return `post:${postId}:email`;
}

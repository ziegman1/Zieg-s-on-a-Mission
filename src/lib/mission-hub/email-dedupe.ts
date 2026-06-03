/** Dedupe keys for Mission Hub email delivery log (one row per recipient per key). */

export type MissionHubEmailNotificationKind =
  | "newsletter_published"
  | "blog_published"
  | "post_published"
  | "urgent_prayer_request"
  | "new_post"
  | "weekly_digest"
  | "invitation";

export function newsletterPublishEmailDedupeKey(newsletterId: string): string {
  return `newsletter:${newsletterId}:email`;
}

export function blogPublishEmailDedupeKey(blogPostId: string): string {
  return `blog:${blogPostId}:email`;
}

export function postPublishEmailDedupeKey(postId: string): string {
  return `post:${postId}:email`;
}

export function urgentPrayerPublishEmailDedupeKey(postId: string): string {
  return `urgent-prayer:${postId}:email`;
}

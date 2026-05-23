/** Dedupe keys for Mission Hub email delivery log (one row per recipient per key). */

export type MissionHubEmailNotificationKind =
  | "newsletter_published"
  | "new_post"
  | "weekly_digest"
  | "invitation";

export function newsletterPublishEmailDedupeKey(newsletterId: string): string {
  return `newsletter:${newsletterId}:email`;
}

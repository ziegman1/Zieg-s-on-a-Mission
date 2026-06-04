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

/** ISO week key for digest dedupe, e.g. `2026-W20`. */
export function weeklyDigestWeekKey(referenceDate: Date): string {
  const d = new Date(Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const isoYear = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const isoWeek = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${isoYear}-W${String(isoWeek).padStart(2, "0")}`;
}

export function weeklyDigestEmailDedupeKey(referenceDate: Date): string {
  return `weekly-digest:${weeklyDigestWeekKey(referenceDate)}:email`;
}

/** Admin test sends — separate dedupe so tests do not block member delivery. */
export function weeklyDigestTestEmailDedupeKey(referenceDate: Date, userId: string): string {
  return `weekly-digest:${weeklyDigestWeekKey(referenceDate)}:test:${userId}`;
}

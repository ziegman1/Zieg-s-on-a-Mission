/**
 * Optional first-party engagement/CTA analytics gate.
 * Must stay off in production until a consent posture is explicitly approved.
 * Page views are independent of this flag.
 */
export function isAnalyticsEngagementEnabled(
  envValue: string | null | undefined = process.env.NEXT_PUBLIC_ANALYTICS_ENGAGEMENT_ENABLED,
): boolean {
  return envValue === "1" || envValue === "true";
}

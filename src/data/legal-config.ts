/**
 * Legal and compliance configuration.
 * Edit these values for your business before launch.
 */

export const LEGAL_CONFIG = {
  /** Support / contact email */
  supportEmail: "jeremy@ziegsonamission.com",

  /** Resend "from" header — must match a verified domain in Resend */
  orderEmailFrom:
    "Zieg's on a Mission <orders@ziegsonamission.com>",

  /** Privacy Policy effective date (YYYY-MM-DD) */
  privacyEffectiveDate: "2026-11-03",

  /** Terms of Service effective date (YYYY-MM-DD) */
  termsEffectiveDate: "2026-03-09",

  /** Days after delivery within which damaged/defective items must be reported */
  damagedItemReportingWindowDays: 14,

  /**
   * Governing law and venue placeholder.
   * TODO: Review with legal counsel and replace with your state/jurisdiction.
   */
  governingLawPlaceholder: "[State of [YOUR STATE], United States]",

  /**
   * Support response time expectation.
   * TODO: Set based on your actual support capacity.
   */
  supportResponseTime: "within 1–2 business days",

  /** Site URL for links in emails */
  siteUrl: "https://ziegsonamission.com",
} as const;

/**
 * Analytics note (privacy-first, Option B):
 * - No analytics marketing cookies, no localStorage analytics IDs, no fingerprints, no
 *   third-party pixels, no cross-site tracking. Visitor uniqueness uses a salted IP hash
 *   server-side (raw IP not stored on PageView). Engagement metadata is allowlisted/coarse.
 * - Geography from Vercel `x-vercel-ip-country` when VERCEL=1 (or ANALYTICS_GEO_COUNTRY_OVERRIDE
 *   for local tests). Client-supplied country is ignored. EEA/UK + unknown → consent required
 *   before sessionStorage analytics IDs, page views, engagement, and visitorId ingest.
 *   Other known regions (e.g. US) → disclosed first-party; DNT still skips engagement/CTA.
 * - Consent choice stored in HttpOnly `zoam_analytics_consent` (granted|denied) after affirmative
 *   Accept/Decline; changeable via Analytics preferences. Engagement events also require
 *   NEXT_PUBLIC_ANALYTICS_ENGAGEMENT_ENABLED.
 * Essential session/cart cookies and Mission Hub visitor cookies are separate systems.
 */

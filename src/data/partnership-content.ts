/**
 * Giving URLs: set NEXT_PUBLIC_GIVING_MONTHLY_URL and NEXT_PUBLIC_GIVING_ONE_TIME_URL
 * in Vercel when real processors are ready; otherwise CTAs fall back to /contact.
 *
 * Tier / milestone / impact / compliance strings match code defaults in
 * `marketing-pages-defaults` (and admin Site Copy). Import from here for static pages
 * that do not call `getSiteCopy()`.
 */

import { DEFAULT_PARTNER_PAGE } from "./marketing-pages-defaults";

export type PartnershipTier = {
  amountLabel: string;
  name: string;
  description: string;
  giftNote: string;
};

export const PARTNERSHIP_TIERS: PartnershipTier[] = DEFAULT_PARTNER_PAGE.tiers;

export type MilestoneGift = {
  when: string;
  title: string;
  description: string;
};

export const MILESTONE_GIFTS: MilestoneGift[] = DEFAULT_PARTNER_PAGE.milestones;

export const IMPACT_POINTS: string[] = DEFAULT_PARTNER_PAGE.impactBullets;

export const COMPLIANCE_PLACEHOLDER = DEFAULT_PARTNER_PAGE.complianceBoxBody;

export function getMonthlyGivingHref(): string {
  const u = process.env.NEXT_PUBLIC_GIVING_MONTHLY_URL?.trim();
  return u && u.length > 0 ? u : "/contact";
}

export function getOneTimeGivingHref(): string {
  const u = process.env.NEXT_PUBLIC_GIVING_ONE_TIME_URL?.trim();
  return u && u.length > 0 ? u : "/contact";
}

/** Homepage — partnership model band (static). */
export const HOME_PARTNERSHIP_MODEL = {
  title: "We’re building a team of monthly partners",
  body: `Monthly partnership sustains the mission. Recurring support helps us plan training, mobilization, and care for the field — so every partner helps make ongoing ministry possible. You’re not “subscribing to a product”; you’re joining a shared mission.`,
} as const;

/** Homepage — thank-you gifts teaser (static). */
export const HOME_GIFTS_TEASER = {
  title: "Thank-you gifts along the journey",
  body: `Partners may receive occasional thank-you gifts and milestone surprises — expressions of gratitude, not payment for goods. The heart of partnership is the mission; gifts simply say “you’re with us.”`,
} as const;

/** Homepage — final CTA band (static). */
export const HOME_FINAL_CTA = {
  title: "Ready to join the mission?",
  body: "Become a monthly partner, make a one-time gift, or reach out — we’d be honored to walk with you.",
} as const;

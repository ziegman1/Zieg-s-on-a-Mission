/**
 * Static partnership funnel copy — no database. Safe for static generation.
 * Giving URLs: set NEXT_PUBLIC_GIVING_MONTHLY_URL and NEXT_PUBLIC_GIVING_ONE_TIME_URL
 * in Vercel when real processors are ready; otherwise CTAs fall back to /contact.
 */

export type PartnershipTier = {
  amountLabel: string;
  name: string;
  description: string;
  giftNote: string;
};

export const PARTNERSHIP_TIERS: PartnershipTier[] = [
  {
    amountLabel: "$25 / month",
    name: "Field Partner",
    description:
      "Helps sustain everyday ministry needs and outreach so the mission can keep moving forward where God opens doors.",
    giftNote: "Thank-you gifts along the way reflect our gratitude — never a transaction.",
  },
  {
    amountLabel: "$50 / month",
    name: "Mission Partner",
    description:
      "Helps strengthen monthly ministry momentum, training efforts, and the care we give to workers and churches.",
    giftNote: "Occasional gifts celebrate your place on the team.",
  },
  {
    amountLabel: "$100 / month",
    name: "Core Partner",
    description:
      "Helps provide deeper support for ministry expansion, disciple-making, and long-range gospel impact.",
    giftNote: "Milestone moments may include special thank-yous as we journey together.",
  },
  {
    amountLabel: "$250+ / month",
    name: "Commissioning Partner",
    description:
      "Helps fuel major ministry opportunities, sending, and sustained impact among those who have yet to hear.",
    giftNote: "We honor this level of commitment with intentional gratitude, not commerce.",
  },
];

export type MilestoneGift = {
  when: string;
  title: string;
  description: string;
};

export const MILESTONE_GIFTS: MilestoneGift[] = [
  {
    when: "Month 1",
    title: "Welcome to the mission",
    description:
      "A small welcome gift — often a sticker pack or note — so you know you’re part of the team from day one.",
  },
  {
    when: "Month 3",
    title: "Growing together",
    description:
      "A branded shirt or similar item as a celebratory thank-you for walking with us through the first quarter.",
  },
  {
    when: "Month 6",
    title: "Half a year of partnership",
    description:
      "A hoodie or upgraded thank-you gift marks six months of shared mission and faithful support.",
  },
  {
    when: "One year",
    title: "A year on mission together",
    description:
      "A special thank-you package — often including a handwritten note and a premium partner gift — with deep gratitude.",
  },
];

export const IMPACT_POINTS: string[] = [
  "Training and equipping believers to make disciples",
  "Mobilizing workers and churches toward the unreached",
  "Disciple-making and coaching that multiplies gospel laborers",
  "Practical ministry outreach and care in the field",
  "Prayer, partnership, and stability for long-term fruit",
];

export const COMPLIANCE_PLACEHOLDER = `Tax and legal language varies by organization and jurisdiction. This section is a placeholder: your team can add disclosure about tax-deductibility, fair market value of any thank-you items, and other giving policies when your accountant or counsel provides approved wording.`;

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

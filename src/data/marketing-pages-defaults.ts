/**
 * Defaults for /partner, /give, /merch — merged with DB in SiteCopy (admin-editable).
 */

export type PartnerTierRow = {
  amountLabel: string;
  name: string;
  description: string;
  giftNote: string;
};

export type PartnerMilestoneRow = {
  when: string;
  title: string;
  description: string;
};

export type PartnerWayToGetInvolvedRow = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

export type PartnerPageCopy = {
  metaTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  heroTitle: string;
  heroBody: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  whyHeading: string;
  whyBodyParagraph1: string;
  whyBodyParagraph2: string;
  waysToGetInvolvedHeading: string;
  waysToGetInvolvedIntro: string;
  waysToGetInvolved: PartnerWayToGetInvolvedRow[];
  tiersHeading: string;
  tiersIntro: string;
  tiers: PartnerTierRow[];
  thankYouHeading: string;
  thankYouParagraph1: string;
  thankYouParagraph2: string;
  milestonesHeading: string;
  milestonesIntro: string;
  milestones: PartnerMilestoneRow[];
  impactHeading: string;
  impactIntro: string;
  impactBullets: string[];
  complianceBoxTitle: string;
  complianceBoxBody: string;
  finalHeading: string;
  finalBody: string;
  finalPrimaryCtaLabel: string;
  finalSecondaryCtaLabel: string;
  finalOneTimeCtaLabel: string;
  finalContactCtaLabel: string;
};

export type GivePageCopy = {
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  title: string;
  intro: string;
  monthlySectionHeading: string;
  monthlySectionBody: string;
  startMonthlyCta: string;
  learnPartnerCta: string;
  suggestedLevelsHeading: string;
  suggestedLevelsIntro: string;
  becomeMonthlyCta: string;
  oneTimeHeading: string;
  oneTimeBody: string;
  oneTimeSuggestions: string[];
  oneTimeCta: string;
  thankYouHeading: string;
  thankYouBeforePartnerLink: string;
  thankYouPartnerLinkLabel: string;
  thankYouAfterPartnerLink: string;
  complianceHeading: string;
  complianceBody: string;
  footerContactCta: string;
  footerPartnerCta: string;
};

export type MerchPageCopy = {
  kicker: string;
  title: string;
  intro: string;
  thankYouHeading: string;
  thankYouBeforePartnerLink: string;
  thankYouPartnerLinkLabel: string;
  thankYouAfterPartnerLink: string;
  collectionHeading: string;
  collectionBody: string;
  ctaPartner: string;
  ctaGive: string;
  ctaContact: string;
  backHome: string;
};

const DEFAULT_PARTNER_TIERS: PartnerTierRow[] = [
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

const DEFAULT_PARTNER_MILESTONES: PartnerMilestoneRow[] = [
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

export const DEFAULT_PARTNER_PAGE: PartnerPageCopy = {
  metaTitle: "Become a Partner",
  metaDescription:
    "Join Zieg's on a Mission as a monthly partner — sustain training, mobilization, and gospel advance with Team Expansion.",
  heroEyebrow: "Join the mission",
  heroTitle: "Become a Monthly Partner in the Mission",
  heroBody:
    "Monthly partnership is our primary pathway for sustaining the mission — training, mobilization, and gospel advance with consistency. You become part of the team through prayer, recurring support, advocacy, or a one-time gift when that fits best.",
  primaryCtaLabel: "Become a Monthly Partner",
  secondaryCtaLabel: "Explore Ways to Get Involved",
  whyHeading: "Why monthly partnership matters",
  whyBodyParagraph1:
    "Consistent support creates stability — for planning, for people, and for the long obedience of ministry. Monthly giving isn’t a subscription; it’s walking together month after month as ministry partners.",
  whyBodyParagraph2:
    "Partnership is shared mission. We pray for partners, share updates honestly, and invite you into prayer, advocacy, and giving — each pathway matters, and monthly partnership anchors the work.",
  waysToGetInvolvedHeading: "Ways to Get Involved",
  waysToGetInvolvedIntro:
    "There is more than one way to walk with us. Choose the pathway that fits where God is leading you — and know that monthly partnership remains our primary need for long-term stability.",
  waysToGetInvolved: [
    {
      title: "Pray",
      description: "Join our prayer network.",
      href: "/community",
      ctaLabel: "Join Mission Hub",
    },
    {
      title: "Partner",
      description: "Become a recurring monthly ministry partner.",
      href: "/partner#partnership-tiers",
      ctaLabel: "See partnership levels",
    },
    {
      title: "Advocate",
      description: "Join the Advocacy Team and help expand ministry partnerships.",
      href: "/advocacy-team",
      ctaLabel: "Learn about advocacy",
    },
    {
      title: "Give",
      description: "Make a one-time gift to support the mission.",
      href: "/give",
      ctaLabel: "Give now",
    },
  ],
  tiersHeading: "Ways to join the mission",
  tiersIntro:
    "These levels describe partnership — not products. Choose the monthly rhythm that fits; every tier fuels training, mobilization, and gospel advance.",
  tiers: DEFAULT_PARTNER_TIERS,
  thankYouHeading: "Thank-you gifts",
  thankYouParagraph1:
    "As a thank-you for your partnership, we love sending occasional gifts that remind you you’re part of this mission — not because you “bought” something, but because we’re grateful.",
  thankYouParagraph2:
    "These gifts are expressions of gratitude, not purchases. The heart of our relationship is the gospel work we share; anything we send is a small celebration of that together.",
  milestonesHeading: "Milestones on the journey",
  milestonesIntro:
    "We celebrate faithful partnership over time — small markers of a shared mission, never a sales pitch.",
  milestones: DEFAULT_PARTNER_MILESTONES,
  impactHeading: "What your partnership fuels",
  impactIntro:
    "Every monthly partner strengthens the same work — here are some of the outcomes we pursue together:",
  impactBullets: [
    "Training and equipping believers to make disciples",
    "Mobilizing workers and churches toward the unreached",
    "Disciple-making and coaching that multiplies gospel laborers",
    "Practical ministry outreach and care in the field",
    "Prayer, partnership, and stability for long-term fruit",
  ],
  complianceBoxTitle: "Note for your records",
  complianceBoxBody: `Tax and legal language varies by organization and jurisdiction. This section is a placeholder: your team can add disclosure about tax-deductibility, fair market value of any thank-you items, and other giving policies when your accountant or counsel provides approved wording.`,
  finalHeading: "Take the next step",
  finalBody:
    "We’d be honored to have you on the team. Monthly partnership is our primary path for sustaining the mission — and we also welcome prayer partners, Advocacy Team members, and one-time gifts.",
  finalPrimaryCtaLabel: "Become a Monthly Partner",
  finalSecondaryCtaLabel: "Join the Advocacy Team",
  finalOneTimeCtaLabel: "Give a One-Time Gift",
  finalContactCtaLabel: "Contact us",
};

export const DEFAULT_GIVE_PAGE: GivePageCopy = {
  metaTitle: "Give",
  metaDescription:
    "Support Zieg's on a Mission through monthly partnership or a one-time gift — training, mobilization, and gospel advance.",
  kicker: "Give",
  title: "Support the mission",
  intro:
    "You can walk with us through monthly partnership (our primary need for stability) or a one-time gift for special opportunities. Either way, thank you for fueling gospel advance.",
  monthlySectionHeading: "Monthly partnership — primary path",
  monthlySectionBody:
    "Recurring support helps us plan training, mobilization, and care in the field. When you’re ready, use the button below — or contact us if you’d like to talk through options first.",
  startMonthlyCta: "Start monthly partnership",
  learnPartnerCta: "Learn about partnership",
  suggestedLevelsHeading: "Suggested monthly levels",
  suggestedLevelsIntro: "Same partnership tiers as our partner page — choose what fits your family.",
  becomeMonthlyCta: "Become a monthly partner",
  oneTimeHeading: "One-time gift",
  oneTimeBody:
    "One-time gifts help with special projects, travel, or urgent needs. If a monthly rhythm isn’t the right fit yet, we’re still grateful.",
  oneTimeSuggestions: ["$50", "$100", "$250", "$500", "Other amount"],
  oneTimeCta: "Give a one-time gift",
  thankYouHeading: "Thank-you gifts",
  thankYouBeforePartnerLink:
    "Some support levels may include occasional thank-you gifts or milestone gifts — always as gratitude, never as something you “earn” like a purchase. See our ",
  thankYouPartnerLinkLabel: "partner page",
  thankYouAfterPartnerLink: " for how we frame gifts alongside partnership.",
  complianceHeading: "Giving & tax language (editable later)",
  complianceBody: DEFAULT_PARTNER_PAGE.complianceBoxBody,
  footerContactCta: "Questions? Contact us",
  footerPartnerCta: "Partnership details",
};

export const DEFAULT_MERCH_PAGE: MerchPageCopy = {
  kicker: "Support the mission",
  title: "Partner gifts & mission merch",
  intro:
    "This space is for items that support the mission — including thank-you gifts for monthly partners and, over time, optional merch for friends who want to wear the story. Nothing here replaces partnership; it celebrates and fuels the work alongside you.",
  thankYouHeading: "Thank-you gifts",
  thankYouBeforePartnerLink:
    "Partners may receive occasional gifts and milestone thank-yous — gratitude, not a store receipt. Read how we frame gifts on our ",
  thankYouPartnerLinkLabel: "partner page",
  thankYouAfterPartnerLink: ".",
  collectionHeading: "Broader collection",
  collectionBody:
    "We’re preparing a fuller selection of mission-aligned items. When it launches, you’ll find it here — still secondary to monthly partnership and one-time giving.",
  ctaPartner: "Become a Monthly Partner",
  ctaGive: "Give a One-Time Gift",
  ctaContact: "Contact us",
  backHome: "← Back to home",
};

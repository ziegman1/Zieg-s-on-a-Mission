/**
 * Default storefront copy. Admin edits merge on top (see getSiteCopy).
 */

import { ABOUT_MISSION_PAGE_CONTENT } from "./about-mission-page-content";
import { DEFAULT_HOME_GUIDED, type HomeGuided } from "./home-guided-default-sections";
import {
  DEFAULT_GIVE_PAGE,
  DEFAULT_MERCH_PAGE,
  DEFAULT_PARTNER_PAGE,
  type GivePageCopy,
  type MerchPageCopy,
  type PartnerPageCopy,
} from "./marketing-pages-defaults";
import { defaultSiteCopyNavLinks } from "./storefront-navigation";

export type { HomeGuided, HomeGuidedSectionRow } from "./home-guided-default-sections";
export type { GivePageCopy, MerchPageCopy, PartnerPageCopy, PartnerWayToGetInvolvedRow } from "./marketing-pages-defaults";

export type NavLinkDef = { href: string; label: string };

export type SiteCopy = {
  site: {
    name: string;
    tagline: string;
    description: string;
  };
  navLinks: NavLinkDef[];
  footer: { blurb: string };
  home: {
    whoTitle: string;
    whoBody: string;
    whoCta: string;
    whyTitle: string;
    whyBody: string;
    whyCta: string;
    merchTitle: string;
    merchBlurb: string;
    featuredTitle: string;
    featuredEmpty: string;
    viewAllMerchLabel: string;
  };
  homeHero: {
    headline: string;
    subheadline: string;
    body: string;
    primaryCtaLabel: string;
    secondaryCtaLabel: string;
  };
  /** Homepage below-the-fold: guided sections, hero image URL, scroll break, closing. */
  homeGuided: HomeGuided;
  about: {
    title: string;
    lede: string;
    heroEyebrow: string;
    heroHeadline: string;
    heroSubheadline: string;
    heroBody: string;
    heroPrimaryCtaLabel: string;
    heroPrimaryCtaUrl: string;
    heroSecondaryCtaLabel: string;
    heroSecondaryCtaUrl: string;
    sections: { heading: string; body: string }[];
    closingCtaHeadline: string;
    closingCtaBody: string;
    closingPrimaryCtaLabel: string;
    closingPrimaryCtaUrl: string;
    closingSecondaryCtaLabel: string;
    closingSecondaryCtaUrl: string;
    closingTertiaryCtaLabel: string;
    closingTertiaryCtaUrl: string;
  };
  mission: {
    title: string;
    lede: string;
    focusHeading: string;
    bullets: string[];
    merchHeading: string;
    merchBody: string;
  };
  blog: {
    title: string;
    lede: string;
    intro: string;
    topicsHeading: string;
    topics: string[];
    emptyNote: string;
  };
  contact: {
    intro: string;
    responseExpectation: string;
    helpHeading: string;
    helpBullets: string[];
    beforeContactLead: string;
  };
  legalSupport: {
    supportEmail: string;
    supportResponseTime: string;
  };
  /** /partner — full page copy (tiers also used on /give for suggested levels). */
  partnerPage: PartnerPageCopy;
  /** /give — copy only; tiers come from `partnerPage.tiers`. */
  givePage: GivePageCopy;
  /** /merch */
  merchPage: MerchPageCopy;
};

export const DEFAULT_SITE_COPY: SiteCopy = {
  site: {
    name: "Zieg's on a Mission",
    tagline: "Mission · Partnership · Ministry",
    description:
      "Join the mission as a monthly partner — training, mobilization, and gospel advance with Team Expansion. Optional merch and thank-you gifts for supporters.",
  },
  navLinks: defaultSiteCopyNavLinks(),
  footer: {
    blurb:
      "A ministry partnership home — monthly partners sustain the work; one-time gifts and optional merch support the mission alongside you.",
  },
  home: {
    whoTitle: "Who we are",
    whoBody:
      "We’re Jeremy and family — ordinary people who believe God calls every follower of Jesus into mission. Get to know our story and how we serve with Team Expansion.",
    whoCta: "About us →",
    whyTitle: "Why monthly partnership",
    whyBody:
      "Consistent support creates stability for training, mobilization, and care in the field. Partnership means shared mission — not a transaction — with optional thank-you gifts along the way.",
    whyCta: "Read our mission →",
    merchTitle: "Partner gifts & optional merch",
    merchBlurb:
      "Some items are shared as thank-yous for partners; a broader collection may open over time. Merch supports the mission — it never replaces partnership.",
    featuredTitle: "Ways to support the mission",
    featuredEmpty:
      "Monthly partners keep the work sustainable. One-time gifts help with special needs. We’re glad you’re here.",
    viewAllMerchLabel: "Explore gifts & merch",
  },
  homeHero: {
    headline: "Zieg's on a Mission",
    subheadline: "Helping People Find Their Place in God's Mission",
    body: `We exist to mobilize and equip ordinary people to make an extraordinary impact for God's Kingdom. Serving with Team Expansion, our vision is to see disciples multiplied and churches planted among the unreached. Through mobilization, training, and coaching, we help raise up new workers who will carry the Gospel to the ends of the earth. We’d love for you to be part of this story.`,
    primaryCtaLabel: "Become a Monthly Partner",
    secondaryCtaLabel: "Learn More",
  },
  homeGuided: DEFAULT_HOME_GUIDED,
  about: {
    title: "About & Mission",
    lede: "",
    heroEyebrow: ABOUT_MISSION_PAGE_CONTENT.hero.eyebrow,
    heroHeadline: ABOUT_MISSION_PAGE_CONTENT.hero.headline,
    heroSubheadline: ABOUT_MISSION_PAGE_CONTENT.hero.subheadline,
    heroBody: ABOUT_MISSION_PAGE_CONTENT.hero.body,
    heroPrimaryCtaLabel: ABOUT_MISSION_PAGE_CONTENT.hero.primaryCtaLabel,
    heroPrimaryCtaUrl: ABOUT_MISSION_PAGE_CONTENT.hero.primaryCtaUrl,
    heroSecondaryCtaLabel: ABOUT_MISSION_PAGE_CONTENT.hero.secondaryCtaLabel,
    heroSecondaryCtaUrl: ABOUT_MISSION_PAGE_CONTENT.hero.secondaryCtaUrl,
    sections: ABOUT_MISSION_PAGE_CONTENT.bodySections.map((section) => ({
      heading: section.headline,
      body: section.body,
    })),
    closingCtaHeadline: ABOUT_MISSION_PAGE_CONTENT.closingCta.headline,
    closingCtaBody: ABOUT_MISSION_PAGE_CONTENT.closingCta.body,
    closingPrimaryCtaLabel: ABOUT_MISSION_PAGE_CONTENT.closingCta.primaryCtaLabel,
    closingPrimaryCtaUrl: ABOUT_MISSION_PAGE_CONTENT.closingCta.primaryCtaUrl,
    closingSecondaryCtaLabel: ABOUT_MISSION_PAGE_CONTENT.closingCta.secondaryCtaLabel,
    closingSecondaryCtaUrl: ABOUT_MISSION_PAGE_CONTENT.closingCta.secondaryCtaUrl,
    closingTertiaryCtaLabel: ABOUT_MISSION_PAGE_CONTENT.closingCta.tertiaryCtaLabel,
    closingTertiaryCtaUrl: ABOUT_MISSION_PAGE_CONTENT.closingCta.tertiaryCtaUrl,
  },
  mission: {
    title: "Our mission",
    lede: `We exist to mobilize and equip people for God's Kingdom—especially among the unreached. Monthly partnership helps us train, send, and sustain workers with consistency and care.`,
    focusHeading: "What partnership helps accomplish",
    bullets: [
      "Training and equipping believers to make disciples",
      "Mobilizing churches and teams toward the unreached",
      "Sustaining field care and coaching through monthly partners",
      "Inviting friends into prayer, recurring support, and shared mission",
    ],
    merchHeading: "Thank-you gifts & optional merch",
    merchBody: `Items on this site may include thank-you gifts for partners or optional merch that supports ministry costs. They’re never a substitute for partnership — they’re one more way to celebrate and fuel the mission together.`,
  },
  blog: {
    title: "Blog",
    lede: `Stories, updates, and resources from the field and from home—so you can pray specifically and celebrate what God is doing.`,
    intro: `We're building this space for honest updates: not polished perfection, but real life on mission. New posts will show up here as we publish them.`,
    topicsHeading: "What you'll find here",
    topics: [
      "Prayer requests and praise reports",
      "Short reflections on ministry and faith",
      "Resources we love for mission-minded friends",
    ],
    emptyNote: `No posts yet—check back soon, or say hello on the contact page if you'd like to connect.`,
  },
  contact: {
    intro: `We’re glad you reached out. For partnership, giving, or general questions, use the form or email below. For order-related questions when the shop is active, include your order number if you have one.`,
    responseExpectation: `We aim to respond within 1–2 business days.`,
    helpHeading: "How we can help",
    helpBullets: [
      "Becoming a monthly partner or making a one-time gift",
      "Questions about thank-you gifts or milestones",
      "Order status when merch is available",
      "Prayer, updates, and ministry questions",
    ],
    beforeContactLead: "For faster answers, please review our",
  },
  legalSupport: {
    supportEmail: "jeremy@ziegsonamission.com",
    supportResponseTime: "within 1–2 business days",
  },
  partnerPage: DEFAULT_PARTNER_PAGE,
  givePage: DEFAULT_GIVE_PAGE,
  merchPage: DEFAULT_MERCH_PAGE,
};

import { z } from "zod";
import { DEFAULT_SITE_COPY } from "@/data/site-copy-defaults";

const navLen = DEFAULT_SITE_COPY.navLinks.length;

const navLinkSchema = z.object({
  href: z.string(),
  label: z.string().min(1).max(80),
});

const sectionSchema = z.object({
  heading: z.string().min(1).max(200),
  body: z.string().min(1).max(20000),
});

const homeGuidedSectionSchema = z.object({
  id: z.string(),
  href: z.string(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(20000),
  ctaLabel: z.string().min(1).max(120),
  imageUrl: z.string().max(2000),
});

export const siteCopySaveSchema = z.object({
  site: z.object({
    name: z.string().min(1).max(200),
    tagline: z.string().max(200),
    description: z.string().min(1).max(2000),
  }),
  navLinks: z.array(navLinkSchema).length(navLen),
  footer: z.object({
    blurb: z.string().min(1).max(2000),
  }),
  home: z.object({
    whoTitle: z.string().min(1).max(200),
    whoBody: z.string().min(1).max(4000),
    whoCta: z.string().min(1).max(120),
    whyTitle: z.string().min(1).max(200),
    whyBody: z.string().min(1).max(4000),
    whyCta: z.string().min(1).max(120),
    merchTitle: z.string().min(1).max(200),
    merchBlurb: z.string().min(1).max(2000),
    featuredTitle: z.string().min(1).max(200),
    featuredEmpty: z.string().min(1).max(2000),
    viewAllMerchLabel: z.string().min(1).max(120),
  }),
  homeHero: z.object({
    headline: z.string().min(1).max(300),
    body: z.string().min(1).max(20000),
    primaryCtaLabel: z.string().min(1).max(120),
    secondaryCtaLabel: z.string().min(1).max(120),
  }),
  homeGuided: z.object({
    heroImageUrl: z.string().max(2000),
    heroLearnMoreLabel: z.string().min(1).max(80),
    scrollBreakBody: z.string().min(1).max(2000),
    closingBody: z.string().min(1).max(4000),
    sections: z.array(homeGuidedSectionSchema).length(DEFAULT_SITE_COPY.homeGuided.sections.length),
  }),
  about: z.object({
    title: z.string().min(1).max(200),
    lede: z.string().min(1).max(4000),
    sections: z.array(sectionSchema).min(1).max(12),
  }),
  mission: z.object({
    title: z.string().min(1).max(200),
    lede: z.string().min(1).max(4000),
    focusHeading: z.string().min(1).max(200),
    bullets: z.array(z.string().min(1).max(500)).min(1).max(20),
    merchHeading: z.string().min(1).max(200),
    merchBody: z.string().min(1).max(4000),
  }),
  blog: z.object({
    title: z.string().min(1).max(200),
    lede: z.string().min(1).max(2000),
    intro: z.string().min(1).max(4000),
    topicsHeading: z.string().min(1).max(200),
    topics: z.array(z.string().min(1).max(500)).min(1).max(20),
    emptyNote: z.string().min(1).max(2000),
  }),
  contact: z.object({
    intro: z.string().min(1).max(4000),
    responseExpectation: z.string().min(1).max(1000),
    helpHeading: z.string().min(1).max(200),
    helpBullets: z.array(z.string().min(1).max(300)).min(1).max(30),
    beforeContactLead: z.string().min(1).max(500),
  }),
  legalSupport: z.object({
    supportEmail: z.string().min(3).max(200),
    supportResponseTime: z.string().min(1).max(200),
  }),
  partnerPage: z.object({
    metaTitle: z.string().min(1).max(120),
    metaDescription: z.string().min(1).max(500),
    heroEyebrow: z.string().min(1).max(120),
    heroTitle: z.string().min(1).max(300),
    heroBody: z.string().min(1).max(8000),
    primaryCtaLabel: z.string().min(1).max(120),
    secondaryCtaLabel: z.string().min(1).max(120),
    whyHeading: z.string().min(1).max(200),
    whyBodyParagraph1: z.string().min(1).max(4000),
    whyBodyParagraph2: z.string().min(1).max(4000),
    tiersHeading: z.string().min(1).max(200),
    tiersIntro: z.string().min(1).max(2000),
    tiers: z
      .array(
        z.object({
          amountLabel: z.string().min(1).max(80),
          name: z.string().min(1).max(120),
          description: z.string().min(1).max(2000),
          giftNote: z.string().min(1).max(1000),
        }),
      )
      .length(DEFAULT_SITE_COPY.partnerPage.tiers.length),
    thankYouHeading: z.string().min(1).max(200),
    thankYouParagraph1: z.string().min(1).max(4000),
    thankYouParagraph2: z.string().min(1).max(4000),
    milestonesHeading: z.string().min(1).max(200),
    milestonesIntro: z.string().min(1).max(2000),
    milestones: z
      .array(
        z.object({
          when: z.string().min(1).max(80),
          title: z.string().min(1).max(200),
          description: z.string().min(1).max(2000),
        }),
      )
      .length(DEFAULT_SITE_COPY.partnerPage.milestones.length),
    impactHeading: z.string().min(1).max(200),
    impactIntro: z.string().min(1).max(2000),
    impactBullets: z.array(z.string().min(1).max(500)).min(1).max(20),
    complianceBoxTitle: z.string().min(1).max(200),
    complianceBoxBody: z.string().min(1).max(8000),
    finalHeading: z.string().min(1).max(200),
    finalBody: z.string().min(1).max(2000),
    finalPrimaryCtaLabel: z.string().min(1).max(120),
    finalSecondaryCtaLabel: z.string().min(1).max(120),
    finalContactCtaLabel: z.string().min(1).max(120),
  }),
  givePage: z.object({
    metaTitle: z.string().min(1).max(120),
    metaDescription: z.string().min(1).max(500),
    kicker: z.string().min(1).max(80),
    title: z.string().min(1).max(200),
    intro: z.string().min(1).max(4000),
    monthlySectionHeading: z.string().min(1).max(200),
    monthlySectionBody: z.string().min(1).max(4000),
    startMonthlyCta: z.string().min(1).max(120),
    learnPartnerCta: z.string().min(1).max(120),
    suggestedLevelsHeading: z.string().min(1).max(200),
    suggestedLevelsIntro: z.string().min(1).max(2000),
    becomeMonthlyCta: z.string().min(1).max(120),
    oneTimeHeading: z.string().min(1).max(200),
    oneTimeBody: z.string().min(1).max(4000),
    oneTimeSuggestions: z.array(z.string().min(1).max(80)).min(1).max(20),
    oneTimeCta: z.string().min(1).max(120),
    thankYouHeading: z.string().min(1).max(200),
    thankYouBeforePartnerLink: z.string().min(1).max(4000),
    thankYouPartnerLinkLabel: z.string().min(1).max(120),
    thankYouAfterPartnerLink: z.string().min(1).max(2000),
    complianceHeading: z.string().min(1).max(200),
    complianceBody: z.string().min(1).max(8000),
    footerContactCta: z.string().min(1).max(120),
    footerPartnerCta: z.string().min(1).max(120),
  }),
  merchPage: z.object({
    kicker: z.string().min(1).max(120),
    title: z.string().min(1).max(200),
    intro: z.string().min(1).max(4000),
    thankYouHeading: z.string().min(1).max(200),
    thankYouBeforePartnerLink: z.string().min(1).max(4000),
    thankYouPartnerLinkLabel: z.string().min(1).max(120),
    thankYouAfterPartnerLink: z.string().min(1).max(2000),
    collectionHeading: z.string().min(1).max(200),
    collectionBody: z.string().min(1).max(4000),
    ctaPartner: z.string().min(1).max(120),
    ctaGive: z.string().min(1).max(120),
    ctaContact: z.string().min(1).max(120),
    backHome: z.string().min(1).max(120),
  }),
})
  .superRefine((val, ctx) => {
    val.navLinks.forEach((link, i) => {
      const expected = DEFAULT_SITE_COPY.navLinks[i]?.href;
      if (expected && link.href !== expected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Nav href must remain ${expected}`,
          path: ["navLinks", i, "href"],
        });
      }
    });
    val.homeGuided.sections.forEach((row, i) => {
      const expected = DEFAULT_SITE_COPY.homeGuided.sections[i];
      if (expected && row.id !== expected.id) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Home guided section id must remain ${expected.id}`,
          path: ["homeGuided", "sections", i, "id"],
        });
      }
      if (expected && row.href !== expected.href) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Home guided section href must remain ${expected.href}`,
          path: ["homeGuided", "sections", i, "href"],
        });
      }
    });
  });

export type SiteCopySaveInput = z.infer<typeof siteCopySaveSchema>;

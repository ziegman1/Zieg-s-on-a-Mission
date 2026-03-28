import { cache } from "react";
import { DEFAULT_SITE_COPY, type NavLinkDef, type SiteCopy } from "@/data/site-copy-defaults";
import type { PartnerMilestoneRow, PartnerTierRow } from "@/data/marketing-pages-defaults";
import { LEGAL_CONFIG } from "@/data/legal-config";
import { prisma } from "@/lib/db";

const SITE_COPY_ID = "default";

function hasDatabaseUrl(): boolean {
  const u = process.env.DATABASE_URL?.trim();
  return Boolean(u);
}

function mergeNavLinks(saved: unknown): NavLinkDef[] {
  const d = DEFAULT_SITE_COPY.navLinks;
  if (!Array.isArray(saved) || saved.length !== d.length) return d;
  return d.map((link, i) => {
    const row = saved[i] as { href?: string; label?: string } | undefined;
    const label = typeof row?.label === "string" && row.label.trim() ? row.label.trim() : link.label;
    return { href: link.href, label };
  });
}

function mergeAboutSections(
  saved: unknown,
  fallback: SiteCopy["about"]["sections"],
): SiteCopy["about"]["sections"] {
  if (!Array.isArray(saved) || saved.length === 0) return fallback;
  return saved.map((item, i) => {
    const s = item as { heading?: string; body?: string };
    const fb = fallback[i];
    return {
      heading: typeof s?.heading === "string" ? s.heading : fb?.heading ?? `Section ${i + 1}`,
      body: typeof s?.body === "string" ? s.body : fb?.body ?? "",
    };
  });
}

function mergeStringArray(saved: unknown, fallback: string[]): string[] {
  if (!Array.isArray(saved)) return fallback;
  const next = saved.filter((x): x is string => typeof x === "string");
  return next.length > 0 ? next : fallback;
}

function mergeRichText(val: unknown, fallback: string): string {
  if (typeof val !== "string") return fallback;
  return val.trim().length > 0 ? val : fallback;
}

function mergePartnerTierRows(saved: unknown, fallback: PartnerTierRow[]): PartnerTierRow[] {
  if (!Array.isArray(saved)) return fallback;
  return fallback.map((def, i) => {
    const r = saved[i] as Partial<PartnerTierRow> | undefined;
    if (!r || typeof r !== "object") return { ...def };
    return {
      amountLabel: mergeRichText(r.amountLabel, def.amountLabel),
      name: mergeRichText(r.name, def.name),
      description: mergeRichText(r.description, def.description),
      giftNote: mergeRichText(r.giftNote, def.giftNote),
    };
  });
}

function mergePartnerMilestoneRows(
  saved: unknown,
  fallback: PartnerMilestoneRow[],
): PartnerMilestoneRow[] {
  if (!Array.isArray(saved)) return fallback;
  return fallback.map((def, i) => {
    const r = saved[i] as Partial<PartnerMilestoneRow> | undefined;
    if (!r || typeof r !== "object") return { ...def };
    return {
      when: mergeRichText(r.when, def.when),
      title: mergeRichText(r.title, def.title),
      description: mergeRichText(r.description, def.description),
    };
  });
}

function mergePartnerPage(saved: unknown, fb: SiteCopy["partnerPage"]): SiteCopy["partnerPage"] {
  if (!saved || typeof saved !== "object") return fb;
  const p = saved as Partial<SiteCopy["partnerPage"]>;
  return {
    metaTitle: mergeRichText(p.metaTitle, fb.metaTitle),
    metaDescription: mergeRichText(p.metaDescription, fb.metaDescription),
    heroEyebrow: mergeRichText(p.heroEyebrow, fb.heroEyebrow),
    heroTitle: mergeRichText(p.heroTitle, fb.heroTitle),
    heroBody: mergeRichText(p.heroBody, fb.heroBody),
    primaryCtaLabel: mergeRichText(p.primaryCtaLabel, fb.primaryCtaLabel),
    secondaryCtaLabel: mergeRichText(p.secondaryCtaLabel, fb.secondaryCtaLabel),
    whyHeading: mergeRichText(p.whyHeading, fb.whyHeading),
    whyBodyParagraph1: mergeRichText(p.whyBodyParagraph1, fb.whyBodyParagraph1),
    whyBodyParagraph2: mergeRichText(p.whyBodyParagraph2, fb.whyBodyParagraph2),
    tiersHeading: mergeRichText(p.tiersHeading, fb.tiersHeading),
    tiersIntro: mergeRichText(p.tiersIntro, fb.tiersIntro),
    tiers: mergePartnerTierRows(p.tiers, fb.tiers),
    thankYouHeading: mergeRichText(p.thankYouHeading, fb.thankYouHeading),
    thankYouParagraph1: mergeRichText(p.thankYouParagraph1, fb.thankYouParagraph1),
    thankYouParagraph2: mergeRichText(p.thankYouParagraph2, fb.thankYouParagraph2),
    milestonesHeading: mergeRichText(p.milestonesHeading, fb.milestonesHeading),
    milestonesIntro: mergeRichText(p.milestonesIntro, fb.milestonesIntro),
    milestones: mergePartnerMilestoneRows(p.milestones, fb.milestones),
    impactHeading: mergeRichText(p.impactHeading, fb.impactHeading),
    impactIntro: mergeRichText(p.impactIntro, fb.impactIntro),
    impactBullets: mergeStringArray(p.impactBullets, fb.impactBullets),
    complianceBoxTitle: mergeRichText(p.complianceBoxTitle, fb.complianceBoxTitle),
    complianceBoxBody: mergeRichText(p.complianceBoxBody, fb.complianceBoxBody),
    finalHeading: mergeRichText(p.finalHeading, fb.finalHeading),
    finalBody: mergeRichText(p.finalBody, fb.finalBody),
    finalPrimaryCtaLabel: mergeRichText(p.finalPrimaryCtaLabel, fb.finalPrimaryCtaLabel),
    finalSecondaryCtaLabel: mergeRichText(p.finalSecondaryCtaLabel, fb.finalSecondaryCtaLabel),
    finalContactCtaLabel: mergeRichText(p.finalContactCtaLabel, fb.finalContactCtaLabel),
  };
}

function mergeGivePage(saved: unknown, fb: SiteCopy["givePage"]): SiteCopy["givePage"] {
  if (!saved || typeof saved !== "object") return fb;
  const p = saved as Partial<SiteCopy["givePage"]>;
  return {
    metaTitle: mergeRichText(p.metaTitle, fb.metaTitle),
    metaDescription: mergeRichText(p.metaDescription, fb.metaDescription),
    kicker: mergeRichText(p.kicker, fb.kicker),
    title: mergeRichText(p.title, fb.title),
    intro: mergeRichText(p.intro, fb.intro),
    monthlySectionHeading: mergeRichText(p.monthlySectionHeading, fb.monthlySectionHeading),
    monthlySectionBody: mergeRichText(p.monthlySectionBody, fb.monthlySectionBody),
    startMonthlyCta: mergeRichText(p.startMonthlyCta, fb.startMonthlyCta),
    learnPartnerCta: mergeRichText(p.learnPartnerCta, fb.learnPartnerCta),
    suggestedLevelsHeading: mergeRichText(p.suggestedLevelsHeading, fb.suggestedLevelsHeading),
    suggestedLevelsIntro: mergeRichText(p.suggestedLevelsIntro, fb.suggestedLevelsIntro),
    becomeMonthlyCta: mergeRichText(p.becomeMonthlyCta, fb.becomeMonthlyCta),
    oneTimeHeading: mergeRichText(p.oneTimeHeading, fb.oneTimeHeading),
    oneTimeBody: mergeRichText(p.oneTimeBody, fb.oneTimeBody),
    oneTimeSuggestions: mergeStringArray(p.oneTimeSuggestions, fb.oneTimeSuggestions),
    oneTimeCta: mergeRichText(p.oneTimeCta, fb.oneTimeCta),
    thankYouHeading: mergeRichText(p.thankYouHeading, fb.thankYouHeading),
    thankYouBeforePartnerLink: mergeRichText(p.thankYouBeforePartnerLink, fb.thankYouBeforePartnerLink),
    thankYouPartnerLinkLabel: mergeRichText(p.thankYouPartnerLinkLabel, fb.thankYouPartnerLinkLabel),
    thankYouAfterPartnerLink: mergeRichText(p.thankYouAfterPartnerLink, fb.thankYouAfterPartnerLink),
    complianceHeading: mergeRichText(p.complianceHeading, fb.complianceHeading),
    complianceBody: mergeRichText(p.complianceBody, fb.complianceBody),
    footerContactCta: mergeRichText(p.footerContactCta, fb.footerContactCta),
    footerPartnerCta: mergeRichText(p.footerPartnerCta, fb.footerPartnerCta),
  };
}

function mergeMerchPage(saved: unknown, fb: SiteCopy["merchPage"]): SiteCopy["merchPage"] {
  if (!saved || typeof saved !== "object") return fb;
  const p = saved as Partial<SiteCopy["merchPage"]>;
  return {
    kicker: mergeRichText(p.kicker, fb.kicker),
    title: mergeRichText(p.title, fb.title),
    intro: mergeRichText(p.intro, fb.intro),
    thankYouHeading: mergeRichText(p.thankYouHeading, fb.thankYouHeading),
    thankYouBeforePartnerLink: mergeRichText(p.thankYouBeforePartnerLink, fb.thankYouBeforePartnerLink),
    thankYouPartnerLinkLabel: mergeRichText(p.thankYouPartnerLinkLabel, fb.thankYouPartnerLinkLabel),
    thankYouAfterPartnerLink: mergeRichText(p.thankYouAfterPartnerLink, fb.thankYouAfterPartnerLink),
    collectionHeading: mergeRichText(p.collectionHeading, fb.collectionHeading),
    collectionBody: mergeRichText(p.collectionBody, fb.collectionBody),
    ctaPartner: mergeRichText(p.ctaPartner, fb.ctaPartner),
    ctaGive: mergeRichText(p.ctaGive, fb.ctaGive),
    ctaContact: mergeRichText(p.ctaContact, fb.ctaContact),
    backHome: mergeRichText(p.backHome, fb.backHome),
  };
}

function mergeHomeGuided(saved: unknown, fallback: SiteCopy["homeGuided"]): SiteCopy["homeGuided"] {
  if (!saved || typeof saved !== "object") return fallback;
  const s = saved as Record<string, unknown>;
  const d = fallback;
  const patchSections = Array.isArray(s.sections) ? s.sections : null;
  const sections = d.sections.map((def, i) => {
    const row = patchSections?.[i] as Record<string, unknown> | undefined;
    if (!row || typeof row !== "object") return { ...def };
    return {
      id: def.id,
      href: def.href,
      title: typeof row.title === "string" && row.title.trim() ? row.title : def.title,
      body: typeof row.body === "string" ? row.body : def.body,
      ctaLabel:
        typeof row.ctaLabel === "string" && row.ctaLabel.trim() ? row.ctaLabel : def.ctaLabel,
      imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : def.imageUrl,
    };
  });
  return {
    heroImageUrl: typeof s.heroImageUrl === "string" ? s.heroImageUrl : d.heroImageUrl,
    heroLearnMoreLabel:
      typeof s.heroLearnMoreLabel === "string" && s.heroLearnMoreLabel.trim()
        ? s.heroLearnMoreLabel
        : d.heroLearnMoreLabel,
    scrollBreakBody:
      typeof s.scrollBreakBody === "string" && s.scrollBreakBody.trim()
        ? s.scrollBreakBody
        : d.scrollBreakBody,
    closingBody:
      typeof s.closingBody === "string" && s.closingBody.trim() ? s.closingBody : d.closingBody,
    sections,
  };
}

export function mergeSiteCopyPayload(dbPayload: unknown): SiteCopy {
  const p = dbPayload && typeof dbPayload === "object" && !Array.isArray(dbPayload) ? dbPayload : {};
  const patch = p as Partial<SiteCopy>;
  const d = DEFAULT_SITE_COPY;

  return {
    site: { ...d.site, ...patch.site },
    navLinks: mergeNavLinks(patch.navLinks),
    footer: { ...d.footer, ...patch.footer },
    home: { ...d.home, ...patch.home },
    homeHero: { ...d.homeHero, ...patch.homeHero },
    homeGuided: mergeHomeGuided(patch.homeGuided, d.homeGuided),
    about: {
      ...d.about,
      ...patch.about,
      sections: mergeAboutSections(patch.about?.sections, d.about.sections),
    },
    mission: {
      ...d.mission,
      ...patch.mission,
      bullets: mergeStringArray(patch.mission?.bullets, d.mission.bullets),
    },
    blog: {
      ...d.blog,
      ...patch.blog,
      topics: mergeStringArray(patch.blog?.topics, d.blog.topics),
    },
    contact: { ...d.contact, ...patch.contact },
    legalSupport: { ...d.legalSupport, ...patch.legalSupport },
    partnerPage: mergePartnerPage(patch.partnerPage, d.partnerPage),
    givePage: mergeGivePage(patch.givePage, d.givePage),
    merchPage: mergeMerchPage(patch.merchPage, d.merchPage),
  };
}

export const getSiteCopy = cache(async (): Promise<SiteCopy> => {
  if (!hasDatabaseUrl()) {
    return structuredClone(DEFAULT_SITE_COPY);
  }
  try {
    const row = await prisma.siteCopy.findUnique({ where: { id: SITE_COPY_ID } });
    return mergeSiteCopyPayload(row?.payload ?? {});
  } catch {
    return structuredClone(DEFAULT_SITE_COPY);
  }
});

/** Legal templates + emails: support fields can be overridden from SiteCopy admin. */
export async function getMergedLegalConfig() {
  const copy = await getSiteCopy();
  return {
    ...LEGAL_CONFIG,
    supportEmail: copy.legalSupport.supportEmail || LEGAL_CONFIG.supportEmail,
    supportResponseTime:
      copy.legalSupport.supportResponseTime || LEGAL_CONFIG.supportResponseTime,
  };
}

export function homeHeroWithHrefs(copy: SiteCopy) {
  return {
    headline: copy.homeHero.headline,
    body: copy.homeHero.body,
    primaryCta: { href: "/partner" as const, label: copy.homeHero.primaryCtaLabel },
    secondaryCta: { href: "/give" as const, label: copy.homeHero.secondaryCtaLabel },
  };
}

import { contentStr } from "./content-utils";
import type { PageSection } from "./types";

export type CommunityCta = {
  label: string;
  href: string;
};

export type CommunityPageContent = {
  hero: {
    eyebrow: string;
    headline: string;
    body: string;
    primaryCta: CommunityCta;
    secondaryCta: CommunityCta;
  };
  featured: {
    headline: string;
    body: string;
  };
  seo: {
    title: string;
    description: string;
  };
};

function sectionByKey(sections: PageSection[], key: string): PageSection | undefined {
  return sections.find((s) => s.sectionKey === key);
}

function ctaFromSection(c: Record<string, unknown>, labelKey: string, urlKey: string, defaults: CommunityCta): CommunityCta {
  const label = contentStr(c, labelKey).trim();
  const href = contentStr(c, urlKey).trim();
  return {
    label: label || defaults.label,
    href: href || defaults.href,
  };
}

/** Read marketing/SEO fields from site builder `community` page sections. */
export function parseCommunityPageSections(sections: PageSection[]): CommunityPageContent {
  const heroSec = sectionByKey(sections, "hero");
  const featuredSec = sectionByKey(sections, "featured");
  const seoSec = sectionByKey(sections, "seo");

  const heroC = heroSec?.content ?? {};
  const featuredC = featuredSec?.content ?? {};
  const seoC = seoSec?.content ?? {};

  return {
    hero: {
      eyebrow: contentStr(heroC, "eyebrow"),
      headline: contentStr(heroC, "headline"),
      body: contentStr(heroC, "body"),
      primaryCta: ctaFromSection(heroC, "primaryCtaLabel", "primaryCtaUrl", {
        label: "Join Mission Hub",
        href: "/community/join",
      }),
      secondaryCta: ctaFromSection(heroC, "secondaryCtaLabel", "secondaryCtaUrl", {
        label: "Sign in",
        href: "/community/login",
      }),
    },
    featured: {
      headline: contentStr(featuredC, "headline"),
      body: contentStr(featuredC, "body"),
    },
    seo: {
      title: contentStr(seoC, "headline"),
      description: contentStr(seoC, "body"),
    },
  };
}

export function communityIntroIsVisible(content: CommunityPageContent): boolean {
  return Boolean(
    content.hero.headline.trim() ||
      content.hero.body.trim() ||
      content.featured.headline.trim() ||
      content.featured.body.trim(),
  );
}

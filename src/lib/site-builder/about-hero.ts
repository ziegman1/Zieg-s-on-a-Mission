import type { SiteCopy } from "@/data/site-copy-defaults";
import type { PageSection } from "./types";

export function aboutHeroIsVisible(about: SiteCopy["about"]): boolean {
  return Boolean(
    about.heroEyebrow.trim() ||
      about.heroHeadline.trim() ||
      about.heroSubheadline.trim() ||
      about.heroBody.trim(),
  );
}

export function aboutHeroSectionFromCopy(copy: SiteCopy): PageSection {
  const { about } = copy;
  return {
    id: "about-hero-legacy",
    pageKey: "about",
    sectionKey: "hero",
    sectionType: "hero",
    label: "About hero",
    visible: true,
    sortOrder: 0,
    content: {
      eyebrow: about.heroEyebrow,
      headline: about.heroHeadline,
      subheadline: about.heroSubheadline,
      body: about.heroBody,
      primaryCtaLabel: about.heroPrimaryCtaLabel,
      primaryCtaUrl: about.heroPrimaryCtaUrl,
      secondaryCtaLabel: about.heroSecondaryCtaLabel,
      secondaryCtaUrl: about.heroSecondaryCtaUrl,
    },
    settings: {},
  };
}

export function aboutClosingCtaSectionFromCopy(copy: SiteCopy): PageSection {
  const { about } = copy;
  return {
    id: "about-closing-legacy",
    pageKey: "about",
    sectionKey: "where-you-come-in",
    sectionType: "cta",
    label: "Where you come in",
    visible: true,
    sortOrder: 99,
    content: {
      headline: about.closingCtaHeadline,
      body: about.closingCtaBody,
      primaryCtaLabel: about.closingPrimaryCtaLabel,
      primaryCtaUrl: about.closingPrimaryCtaUrl,
      secondaryCtaLabel: about.closingSecondaryCtaLabel,
      secondaryCtaUrl: about.closingSecondaryCtaUrl,
      tertiaryCtaLabel: about.closingTertiaryCtaLabel,
      tertiaryCtaUrl: about.closingTertiaryCtaUrl,
    },
    settings: {},
  };
}

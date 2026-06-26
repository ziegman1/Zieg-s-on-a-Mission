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
    },
    settings: {},
  };
}

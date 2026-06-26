import { registryFor } from "./registry";
import type { PageSection } from "./types";

/** Starter copy for one-time About hero migration — editable in site builder after migration. */
export const ABOUT_HERO_MIGRATION_STARTER = {
  eyebrow: "Our Story",
  headline: "Sent to the field. Called back to send the next 300.",
  subheadline: "We're Jeremy and Lindsay Ziegenhorn.",
  body: "We serve with Team Expansion, and our work comes down to one thing: raising, training, and sending the workers who will reach the people the gospel never has.",
  primaryCtaLabel: "Become a Monthly Partner",
  primaryCtaUrl: "/partner",
  secondaryCtaLabel: "Read our story below",
  secondaryCtaUrl: "#story",
} as const;

export function aboutPageNeedsHeroMigration(sections: PageSection[]): boolean {
  if (sections.length === 0) return false;
  if (sections.some((s) => s.sectionKey === "hero")) return false;
  return sections.some((s) => s.sectionKey === "header");
}

export function buildAboutHeroSection(content: Record<string, string> = ABOUT_HERO_MIGRATION_STARTER): PageSection {
  const reg = registryFor("hero");
  return {
    id: "hero",
    pageKey: "about",
    sectionKey: "hero",
    sectionType: "hero",
    label: "About hero",
    visible: true,
    sortOrder: 0,
    content: {
      ...reg.defaultContent,
      ...content,
    },
    settings: { ...reg.defaultSettings },
  };
}

/**
 * Prepend a Hero section to legacy About pages that still use `header` text_section.
 * Removes the old page header and preserves all other saved sections/content.
 */
export function migrateAboutPageSections(sections: PageSection[]): {
  sections: PageSection[];
  changed: boolean;
} {
  if (!aboutPageNeedsHeroMigration(sections)) {
    return { sections, changed: false };
  }

  const preserved = sections
    .filter((s) => s.sectionKey !== "header")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const next = [buildAboutHeroSection(), ...preserved].map((section, sortOrder) => ({
    ...section,
    sortOrder,
  }));

  return { sections: next, changed: true };
}

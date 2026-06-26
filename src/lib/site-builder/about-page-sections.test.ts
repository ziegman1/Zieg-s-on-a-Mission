import { describe, expect, it } from "vitest";
import {
  ABOUT_MISSION_PAGE_CONTENT,
  ABOUT_MISSION_SECTION_KEYS,
} from "@/data/about-mission-page-content";
import { DEFAULT_SITE_COPY } from "@/data/site-copy-defaults";
import { SECTION_REGISTRY } from "./registry";
import { aboutHeroIsVisible } from "./about-hero";
import { defaultSectionsForPage } from "./defaults";
import {
  aboutNeedsMissionPageMigration,
  migrateAboutMissionPageSections,
} from "./about-mission-migration";
import { partitionMinistrySections } from "./ministry-sections-layout";
import { mergeSiteCopyPayload } from "@/lib/site-copy-merge";
import type { PageSection } from "./types";

describe("default About & Mission sections", () => {
  it("starts with hero and ends with the closing CTA", () => {
    const sections = defaultSectionsForPage("about");
    expect(sections[0]?.sectionKey).toBe("hero");
    expect(sections[0]?.sectionType).toBe("hero");
    expect(sections.at(-1)?.sectionKey).toBe("where-you-come-in");
    expect(sections.at(-1)?.sectionType).toBe("cta");
  });

  it("uses the About & Mission section order", () => {
    const keys = defaultSectionsForPage("about").map((s) => s.sectionKey);
    expect(keys).toEqual([...ABOUT_MISSION_SECTION_KEYS]);
  });

  it("does not include the legacy page header or footer-nav", () => {
    const keys = defaultSectionsForPage("about").map((s) => s.sectionKey);
    expect(keys).not.toContain("header");
    expect(keys).not.toContain("section-0");
    expect(keys).not.toContain("footer-nav");
  });

  it("seeds hero and story copy from the About & Mission content module", () => {
    const sections = defaultSectionsForPage("about");
    const hero = sections.find((s) => s.sectionKey === "hero");
    const story = sections.find((s) => s.sectionKey === "story");
    expect(String(hero?.content.eyebrow ?? "")).toBe(ABOUT_MISSION_PAGE_CONTENT.hero.eyebrow);
    expect(String(hero?.content.headline ?? "")).toBe(ABOUT_MISSION_PAGE_CONTENT.hero.headline);
    expect(String(story?.content.headline ?? "")).toBe(
      ABOUT_MISSION_PAGE_CONTENT.bodySections[0]?.headline,
    );
  });

  it("includes tertiary CTA fields on the closing section", () => {
    const closing = defaultSectionsForPage("about").find((s) => s.sectionKey === "where-you-come-in");
    expect(String(closing?.content.tertiaryCtaLabel ?? "")).toBe(
      ABOUT_MISSION_PAGE_CONTENT.closingCta.tertiaryCtaLabel,
    );
  });

  it("maps all section types to editable registry fields", () => {
    for (const section of defaultSectionsForPage("about")) {
      const reg = SECTION_REGISTRY[section.sectionType];
      expect(reg).toBeDefined();
      for (const field of reg.fields) {
        expect(field.key).toBeTruthy();
      }
    }
  });
});

describe("partitionMinistrySections", () => {
  const hero: PageSection = {
    id: "hero",
    pageKey: "about",
    sectionKey: "hero",
    sectionType: "hero",
    label: "Hero",
    visible: true,
    sortOrder: 0,
    content: { headline: "About Us" },
    settings: {},
  };
  const story: PageSection = {
    id: "story",
    pageKey: "about",
    sectionKey: "story",
    sectionType: "text_section",
    label: "Story",
    visible: true,
    sortOrder: 1,
    content: { headline: "Story", body: "Body copy" },
    settings: {},
  };
  const closing: PageSection = {
    id: "closing",
    pageKey: "about",
    sectionKey: "where-you-come-in",
    sectionType: "cta",
    label: "Closing CTA",
    visible: true,
    sortOrder: 2,
    content: {},
    settings: {},
  };

  it("places hero sections outside the article middle column", () => {
    const layout = partitionMinistrySections([hero, story, closing]);
    expect(layout.heroes).toHaveLength(1);
    expect(layout.middle.map((s) => s.sectionKey)).toEqual(["story", "where-you-come-in"]);
  });
});

describe("migrateAboutMissionPageSections", () => {
  const legacyLayout: PageSection[] = [
    {
      id: "hero",
      pageKey: "about",
      sectionKey: "hero",
      sectionType: "hero",
      label: "About hero",
      visible: true,
      sortOrder: 0,
      content: { headline: "Old hero" },
      settings: {},
    },
    {
      id: "section-0",
      pageKey: "about",
      sectionKey: "section-0",
      sectionType: "text_section",
      label: "Who we are",
      visible: true,
      sortOrder: 1,
      content: { body: "Custom preserved copy" },
      settings: {},
    },
    {
      id: "footer-nav",
      pageKey: "about",
      sectionKey: "footer-nav",
      sectionType: "cta",
      label: "Page links",
      visible: true,
      sortOrder: 2,
      content: {},
      settings: {},
    },
  ];

  it("detects layouts missing the story section", () => {
    expect(aboutNeedsMissionPageMigration(legacyLayout)).toBe(true);
    expect(aboutNeedsMissionPageMigration(defaultSectionsForPage("about"))).toBe(false);
  });

  it("replaces legacy About layouts with the About & Mission defaults", () => {
    const { sections, changed } = migrateAboutMissionPageSections(legacyLayout);
    expect(changed).toBe(true);
    expect(sections.map((s) => s.sectionKey)).toEqual([...ABOUT_MISSION_SECTION_KEYS]);
    expect(sections.find((s) => s.sectionKey === "section-0")).toBeUndefined();
  });
});

describe("legacy About hero copy", () => {
  it("shows the hero when default hero fields are present", () => {
    expect(aboutHeroIsVisible(DEFAULT_SITE_COPY.about)).toBe(true);
  });

  it("hides the hero when saved copy lacks hero fields", () => {
    const merged = mergeSiteCopyPayload({
      about: {
        title: "About",
        lede: "",
        sections: DEFAULT_SITE_COPY.about.sections,
      },
    });
    expect(aboutHeroIsVisible(merged.about)).toBe(false);
    expect(merged.about.heroEyebrow).toBe("");
  });
});

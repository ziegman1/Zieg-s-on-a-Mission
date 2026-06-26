import { describe, expect, it } from "vitest";
import { DEFAULT_SITE_COPY } from "@/data/site-copy-defaults";
import { aboutHeroIsVisible } from "./about-hero";
import { defaultSectionsForPage } from "./defaults";
import { partitionMinistrySections } from "./ministry-sections-layout";
import { mergeSiteCopyPayload } from "@/lib/site-copy-merge";
import {
  ABOUT_HERO_MIGRATION_STARTER,
  aboutPageNeedsHeroMigration,
  migrateAboutPageSections,
} from "./about-page-migration";
import type { PageSection } from "./types";

describe("default About sections", () => {
  it("includes a hero section first", () => {
    const sections = defaultSectionsForPage("about");
    expect(sections[0]?.sectionKey).toBe("hero");
    expect(sections[0]?.sectionType).toBe("hero");
  });

  it("seeds hero eyebrow, headline, subheadline, and body", () => {
    const hero = defaultSectionsForPage("about").find((s) => s.sectionKey === "hero");
    expect(String(hero?.content.eyebrow ?? "")).toBe("Our Story");
    expect(String(hero?.content.headline ?? "")).toBe("About Us");
    expect(String(hero?.content.subheadline ?? "")).toBe(
      "Following Jesus into a calling greater than ourselves.",
    );
    expect(String(hero?.content.body ?? "")).toMatch(/Jeremy and Lindsay/i);
  });

  it("keeps body text sections and footer CTA after the hero", () => {
    const sections = defaultSectionsForPage("about");
    const keys = sections.map((s) => s.sectionKey);
    expect(keys).toEqual(["hero", "section-0", "section-1", "footer-nav"]);
    expect(sections.find((s) => s.sectionKey === "header")).toBeUndefined();
    expect(sections.at(-1)?.sectionType).toBe("cta");
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
  const body: PageSection = {
    id: "section-0",
    pageKey: "about",
    sectionKey: "section-0",
    sectionType: "text_section",
    label: "Who we are",
    visible: true,
    sortOrder: 1,
    content: { headline: "Who we are", body: "Body copy" },
    settings: {},
  };
  const footer: PageSection = {
    id: "footer",
    pageKey: "about",
    sectionKey: "footer-nav",
    sectionType: "cta",
    label: "Links",
    visible: true,
    sortOrder: 2,
    content: {},
    settings: {},
  };

  it("places hero sections outside the article middle column", () => {
    const layout = partitionMinistrySections([hero, body, footer]);
    expect(layout.heroes).toHaveLength(1);
    expect(layout.heroes[0]?.sectionKey).toBe("hero");
    expect(layout.middle.map((s) => s.sectionKey)).toEqual(["section-0"]);
    expect(layout.footer?.sectionKey).toBe("footer-nav");
  });

  it("preserves non-hero ministry page behavior for header and footer", () => {
    const header: PageSection = {
      ...body,
      id: "header",
      sectionKey: "header",
      sectionType: "text_section",
      label: "Header",
    };
    const layout = partitionMinistrySections([hero, header, body, footer]);
    expect(layout.header?.sectionKey).toBe("header");
    expect(layout.middle.map((s) => s.sectionKey)).toEqual(["section-0"]);
  });
});

describe("legacy About hero copy", () => {
  it("shows the hero when default hero fields are present", () => {
    expect(aboutHeroIsVisible(DEFAULT_SITE_COPY.about)).toBe(true);
  });

  it("hides the hero when saved copy lacks hero fields", () => {
    const merged = mergeSiteCopyPayload({
      about: {
        title: "About us",
        lede: "Legacy lede",
        sections: DEFAULT_SITE_COPY.about.sections,
      },
    });
    expect(aboutHeroIsVisible(merged.about)).toBe(false);
    expect(merged.about.heroEyebrow).toBe("");
  });
});

describe("migrateAboutPageSections", () => {
  const legacyHeader: PageSection = {
    id: "hdr-1",
    pageKey: "about",
    sectionKey: "header",
    sectionType: "text_section",
    label: "Page header",
    visible: true,
    sortOrder: 0,
    content: { headline: "About us", body: "Old lede" },
    settings: {},
  };
  const whoWeAre: PageSection = {
    id: "sec-0",
    pageKey: "about",
    sectionKey: "section-0",
    sectionType: "text_section",
    label: "Who we are",
    visible: true,
    sortOrder: 1,
    content: { headline: "Who we are", body: "Custom who body" },
    settings: {},
  };
  const partnership: PageSection = {
    id: "sec-1",
    pageKey: "about",
    sectionKey: "section-1",
    sectionType: "text_section",
    label: "Partnership first",
    visible: true,
    sortOrder: 2,
    content: { headline: "Partnership first", body: "Custom partnership body" },
    settings: {},
  };
  const footer: PageSection = {
    id: "footer-1",
    pageKey: "about",
    sectionKey: "footer-nav",
    sectionType: "cta",
    label: "Page links",
    visible: true,
    sortOrder: 3,
    content: { primaryCtaLabel: "Become a partner", primaryCtaUrl: "/partner" },
    settings: {},
  };

  it("detects legacy About pages that need a hero", () => {
    expect(aboutPageNeedsHeroMigration([legacyHeader, whoWeAre])).toBe(true);
    expect(aboutPageNeedsHeroMigration([whoWeAre, partnership])).toBe(false);
  });

  it("prepends hero, removes header, and preserves saved body sections", () => {
    const { sections, changed } = migrateAboutPageSections([
      legacyHeader,
      whoWeAre,
      partnership,
      footer,
    ]);
    expect(changed).toBe(true);
    expect(sections.map((s) => s.sectionKey)).toEqual([
      "hero",
      "section-0",
      "section-1",
      "footer-nav",
    ]);
    expect(String(sections[0]?.content.headline ?? "")).toBe(ABOUT_HERO_MIGRATION_STARTER.headline);
    expect(String(sections[1]?.content.body ?? "")).toBe("Custom who body");
    expect(String(sections[2]?.content.body ?? "")).toBe("Custom partnership body");
    expect(sections.find((s) => s.sectionKey === "header")).toBeUndefined();
  });

  it("is a no-op when hero already exists", () => {
    const hero: PageSection = {
      id: "hero",
      pageKey: "about",
      sectionKey: "hero",
      sectionType: "hero",
      label: "About hero",
      visible: true,
      sortOrder: 0,
      content: {},
      settings: {},
    };
    const input = [hero, whoWeAre];
    const { sections, changed } = migrateAboutPageSections(input);
    expect(changed).toBe(false);
    expect(sections).toEqual(input);
  });
});

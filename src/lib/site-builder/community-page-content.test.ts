import { describe, expect, it } from "vitest";
import { defaultSectionsForPage } from "./defaults";
import {
  communityIntroIsVisible,
  parseCommunityPageSections,
} from "./community-page-content";
import type { PageSection } from "./types";

describe("community page content", () => {
  it("parses hero CTAs and SEO from default sections", () => {
    const sections = defaultSectionsForPage("community");
    const parsed = parseCommunityPageSections(sections);

    expect(parsed.hero.headline).toMatch(/family space/i);
    expect(parsed.hero.primaryCta.href).toBe("/community/join");
    expect(parsed.hero.secondaryCta.href).toBe("/community/login");
    expect(parsed.seo.title).toMatch(/Mission Hub/i);
    expect(parsed.seo.description.length).toBeGreaterThan(10);
    expect(communityIntroIsVisible(parsed)).toBe(true);
  });

  it("round-trips edited hero fields", () => {
    const base = defaultSectionsForPage("community");
    const sections: PageSection[] = base.map((s) =>
      s.sectionKey === "hero"
        ? {
            ...s,
            content: {
              ...s.content,
              headline: "Test Hub Title",
              body: "Test intro body",
              primaryCtaLabel: "Start",
              primaryCtaUrl: "/community/join",
            },
          }
        : s,
    );

    const parsed = parseCommunityPageSections(sections);
    expect(parsed.hero.headline).toBe("Test Hub Title");
    expect(parsed.hero.body).toBe("Test intro body");
    expect(parsed.hero.primaryCta.label).toBe("Start");
  });
});

import { describe, expect, it } from "vitest";
import { BUILDER_PAGES, NEWSLETTER_BUILDER_NAV, PAGE_REVALIDATE_PATHS } from "./types";
import { defaultSectionsForPage } from "./defaults";

describe("site builder pages", () => {
  it("includes Community in admin navigation", () => {
    const community = BUILDER_PAGES.find((p) => p.pageKey === "community");
    expect(community).toBeDefined();
    expect(community?.label).toBe("Community");
    expect(community?.path).toBe("/community");
  });

  it("revalidates /community when community page is saved", () => {
    expect(PAGE_REVALIDATE_PATHS.community).toContain("/community");
  });

  it("provides default community sections with hero, featured, and seo", () => {
    const sections = defaultSectionsForPage("community");
    const keys = sections.map((s) => s.sectionKey);
    expect(keys).toContain("hero");
    expect(keys).toContain("featured");
    expect(keys).toContain("seo");

    const hero = sections.find((s) => s.sectionKey === "hero");
    expect(hero?.sectionType).toBe("hero");
    expect(String(hero?.content.headline ?? "")).toMatch(/family space/i);

    const seo = sections.find((s) => s.sectionKey === "seo");
    expect(String(seo?.content.headline ?? "")).toMatch(/Mission Hub/i);
  });

  it("exposes newsletters builder nav and revalidation paths", () => {
    expect(NEWSLETTER_BUILDER_NAV.id).toBe("newsletters");
    expect(NEWSLETTER_BUILDER_NAV.label).toBe("Newsletters");
    expect(PAGE_REVALIDATE_PATHS.newsletters).toContain("/newsletters");
  });
});

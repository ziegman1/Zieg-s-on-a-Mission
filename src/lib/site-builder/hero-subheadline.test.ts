import { describe, expect, it } from "vitest";
import { mergeSiteCopyPayload } from "@/lib/site-copy-merge";
import { contentStr, fieldVisible } from "./content-utils";
import { defaultSectionsForPage } from "./defaults";
import { SECTION_REGISTRY } from "./registry";
import type { PageSection } from "./types";

const HERO_COPY_FIELD_ORDER = ["eyebrow", "headline", "subheadline", "body"] as const;

function heroTextFieldKeys(): string[] {
  return SECTION_REGISTRY.hero.fields
    .filter((f) => ["eyebrow", "headline", "subheadline", "body"].includes(f.key))
    .map((f) => f.key);
}

function shouldShowHeroField(
  editMode: boolean,
  content: Record<string, unknown>,
  key: string,
): boolean {
  const text = contentStr(content, key);
  return editMode || (text.trim().length > 0 && fieldVisible(content, key));
}

function minimalHeroSection(content: Record<string, unknown>): PageSection {
  return {
    id: "hero",
    pageKey: "partner",
    sectionKey: "hero",
    sectionType: "hero",
    label: "Hero",
    visible: true,
    sortOrder: 0,
    content: { ...SECTION_REGISTRY.hero.defaultContent, ...content },
    settings: {},
  };
}

describe("Hero subheadline registry", () => {
  it("includes subheadline in hero fields after headline", () => {
    const keys = heroTextFieldKeys();
    expect(keys).toEqual([...HERO_COPY_FIELD_ORDER]);
    expect(SECTION_REGISTRY.hero.defaultContent.subheadline).toBe("");
  });

  it("matches text_section subheadline field definition", () => {
    const heroField = SECTION_REGISTRY.hero.fields.find((f) => f.key === "subheadline");
    const textField = SECTION_REGISTRY.text_section.fields.find((f) => f.key === "subheadline");
    expect(heroField).toEqual(textField);
  });
});

describe("default home hero subheadline", () => {
  it("seeds subheadline on the home hero section", () => {
    const hero = defaultSectionsForPage("home").find((s) => s.sectionKey === "hero");
    expect(hero?.sectionType).toBe("hero");
    expect(String(hero?.content.subheadline ?? "")).toBe(
      "Helping People Find Their Place in God's Mission",
    );
    expect(String(hero?.content.body ?? "")).toMatch(/mobilize and equip ordinary people/i);
  });
});

describe("Hero subheadline visibility", () => {
  it("hides empty subheadline on the public site", () => {
    const section = minimalHeroSection({ subheadline: "" });
    expect(shouldShowHeroField(false, section.content, "subheadline")).toBe(false);
  });

  it("shows subheadline in edit mode when empty", () => {
    const section = minimalHeroSection({ subheadline: "" });
    expect(shouldShowHeroField(true, section.content, "subheadline")).toBe(true);
  });

  it("renders legacy hero content without subheadline unchanged", () => {
    const section = minimalHeroSection({
      headline: "Partner with us",
      body: "Long supporting paragraph.",
    });
    expect(contentStr(section.content, "subheadline")).toBe("");
    expect(shouldShowHeroField(false, section.content, "subheadline")).toBe(false);
    expect(shouldShowHeroField(false, section.content, "headline")).toBe(true);
    expect(shouldShowHeroField(false, section.content, "body")).toBe(true);
  });

  it("keeps legacy site copy without subheadline empty after merge", () => {
    const merged = mergeSiteCopyPayload({
      homeHero: {
        headline: "Custom headline",
        body: "Custom body",
        primaryCtaLabel: "Give",
        secondaryCtaLabel: "Learn",
      },
    });
    expect(merged.homeHero.subheadline).toBe("");
    expect(merged.homeHero.headline).toBe("Custom headline");
  });
});

describe("Hero copy field order", () => {
  it("lists eyebrow, headline, subheadline, then body before CTAs in registry", () => {
    const allKeys = SECTION_REGISTRY.hero.fields.map((f) => f.key);
    const eyebrowIdx = allKeys.indexOf("eyebrow");
    const headlineIdx = allKeys.indexOf("headline");
    const subheadlineIdx = allKeys.indexOf("subheadline");
    const bodyIdx = allKeys.indexOf("body");
    const primaryCtaIdx = allKeys.indexOf("primaryCtaLabel");

    expect(eyebrowIdx).toBeLessThan(headlineIdx);
    expect(headlineIdx).toBeLessThan(subheadlineIdx);
    expect(subheadlineIdx).toBeLessThan(bodyIdx);
    expect(bodyIdx).toBeLessThan(primaryCtaIdx);
  });
});

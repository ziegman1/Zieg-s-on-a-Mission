import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import {
  usesWideImage,
  WIDE_IMAGE_SECTION_KEYS,
  WIDE_IMAGE_SETTING,
} from "./wide-image-section";
import type { PageSection } from "./types";

function section(
  sectionKey: string,
  overrides: Partial<PageSection> = {},
): PageSection {
  return {
    id: `id-${sectionKey}`,
    pageKey: "home",
    sectionKey,
    sectionType: "image_text_split",
    label: sectionKey,
    visible: true,
    sortOrder: 0,
    content: {},
    settings: {},
    ...overrides,
  };
}

describe("section targeting", () => {
  it("targets the section carrying the Mobilize / Train / Send graphic", () => {
    expect(WIDE_IMAGE_SECTION_KEYS).toContain("guided-partner");
    expect(usesWideImage(section("guided-partner"))).toBe(true);
  });

  it("leaves every other homepage image section on the default treatment", () => {
    for (const key of [
      "hero",
      "guided-about",
      "guided-mission",
      "guided-give",
      "guided-merch",
      "guided-blog",
      "guided-contact",
    ]) {
      expect(usesWideImage(section(key))).toBe(false);
    }
  });

  it("ignores the settings of neighbouring sections", () => {
    const neighbour = section("guided-mission", {
      settings: { rowId: "mission", variant: "default", imagePosition: "left" },
    });

    expect(usesWideImage(neighbour)).toBe(false);
  });
});

describe("settings override", () => {
  it("opts a different section in without a code change", () => {
    const moved = section("guided-give", { settings: { [WIDE_IMAGE_SETTING]: true } });

    expect(usesWideImage(moved)).toBe(true);
  });

  it("opts the targeted section out without a code change", () => {
    const disabled = section("guided-partner", {
      settings: { [WIDE_IMAGE_SETTING]: false },
    });

    expect(usesWideImage(disabled)).toBe(false);
  });

  it("falls back to the key list when the setting is absent or not a boolean", () => {
    expect(usesWideImage(section("guided-partner", { settings: {} }))).toBe(true);
    expect(
      usesWideImage(section("guided-partner", { settings: { [WIDE_IMAGE_SETTING]: "yes" } })),
    ).toBe(true);
    expect(
      usesWideImage(section("guided-give", { settings: { [WIDE_IMAGE_SETTING]: "yes" } })),
    ).toBe(false);
  });

  it("survives a section with no settings object", () => {
    const bare = section("guided-partner");
    // @ts-expect-error exercising data that predates the settings column default
    bare.settings = undefined;

    expect(usesWideImage(bare)).toBe(true);
  });
});

describe("rendered treatment", () => {
  const source = readFileSync(
    resolve(__dirname, "../../components/site-builder/sections/image-text-split-section.tsx"),
    "utf8",
  );

  it("shows the whole graphic with object-contain at its natural height", () => {
    expect(source).toContain("w-full h-auto rounded-lg object-contain");
  });

  it("keeps object-cover for the default photo treatment", () => {
    expect(source).toContain("md:h-full rounded-lg object-cover");
  });

  it("drops the border and shadow card treatment for the wide graphic", () => {
    const wideClasses = source.slice(
      source.indexOf("w-full h-auto rounded-lg object-contain"),
    );
    const wideLine = wideClasses.slice(0, wideClasses.indexOf("\n"));

    expect(wideLine).not.toContain("shadow");
    expect(wideLine).not.toContain("border");
  });

  it("centres the wide graphic against the text column instead of stretching it", () => {
    expect(source).toContain('wideImage ? "md:self-center" : "md:h-full md:min-h-0"');
  });

  it("gates the treatment on the shared helper rather than an inline key check", () => {
    expect(source).toContain("usesWideImage(section)");
    expect(source).not.toContain('"guided-partner"');
  });
});

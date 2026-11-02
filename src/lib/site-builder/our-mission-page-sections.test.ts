import { describe, expect, it } from "vitest";
import { OUR_MISSION_HERO } from "@/data/our-mission-content";
import { defaultSectionsForPage } from "./defaults";
import {
  defaultOurMissionEditableSections,
  isOurMissionProtectedSection,
  mergeOurMissionAdminSections,
  partitionOurMissionEditorialSections,
  resolveOurMissionNarrative,
  stripOurMissionProtectedSections,
} from "./our-mission-page-sections";
import { prepareSectionsForSave } from "./sanitize";

describe("our-mission site builder sections", () => {
  it("provides editable narrative defaults from authoritative content", () => {
    const sections = defaultSectionsForPage("our-mission");
    expect(sections.map((s) => s.sectionKey)).toEqual(["hero", "beyond", "invitation"]);
    expect(String(sections[0]?.content.headline)).toBe(OUR_MISSION_HERO.title);
    expect(sections.every((s) => !isOurMissionProtectedSection(s))).toBe(true);
  });

  it("merges protected framework sections into the admin preview order", () => {
    const merged = mergeOurMissionAdminSections(defaultOurMissionEditableSections());
    expect(merged.map((s) => s.sectionKey)).toEqual([
      "hero",
      "tracker",
      "functions",
      "avenues",
      "beyond",
      "measurement",
      "invitation",
    ]);
    expect(merged.filter(isOurMissionProtectedSection).map((s) => s.sectionKey)).toEqual([
      "tracker",
      "functions",
      "avenues",
      "measurement",
    ]);
  });

  it("strips protected sections before save and keeps editable/editorial", () => {
    const merged = mergeOurMissionAdminSections([
      ...defaultOurMissionEditableSections(),
      {
        id: "story",
        pageKey: "our-mission",
        sectionKey: "custom-story",
        sectionType: "text_section",
        label: "Story",
        visible: true,
        sortOrder: 99,
        content: { headline: "A story", body: "Editorial" },
        settings: {},
      },
    ]);
    const saved = prepareSectionsForSave("our-mission", merged);
    expect(saved.map((s) => s.sectionKey)).toEqual([
      "hero",
      "beyond",
      "custom-story",
      "invitation",
    ]);
    expect(saved.some(isOurMissionProtectedSection)).toBe(false);
  });

  it("resolves narrative overrides and keeps framework editorial separate", () => {
    const sections = defaultOurMissionEditableSections().map((section) =>
      section.sectionKey === "hero"
        ? {
            ...section,
            content: {
              ...section.content,
              headline: "Custom headline",
              subheadline: "Custom support",
              body: "First paragraph.\n\nSecond paragraph.",
            },
          }
        : section,
    );
    const narrative = resolveOurMissionNarrative(sections);
    expect(narrative.hero.title).toBe("Custom headline");
    expect(narrative.hero.paragraphs).toEqual(["First paragraph.", "Second paragraph."]);
    expect(partitionOurMissionEditorialSections(sections)).toEqual([]);
  });

  it("does not treat missing custom rows as requiring narrative overrides", () => {
    const narrative = resolveOurMissionNarrative([]);
    expect(narrative.hero.title).toBe(OUR_MISSION_HERO.title);
    expect(narrative.hero.paragraphs).toEqual([...OUR_MISSION_HERO.paragraphs]);
  });

  it("keeps supplemental editorial sections after strip", () => {
    const stripped = stripOurMissionProtectedSections(
      mergeOurMissionAdminSections(defaultOurMissionEditableSections()),
    );
    expect(stripped.every((s) => !isOurMissionProtectedSection(s))).toBe(true);
  });
});

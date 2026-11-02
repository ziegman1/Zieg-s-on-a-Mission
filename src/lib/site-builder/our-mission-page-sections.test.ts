import { describe, expect, it } from "vitest";
import { OUR_MISSION_AVENUES, OUR_MISSION_HERO } from "@/data/our-mission-content";
import { defaultSectionsForPage } from "./defaults";
import {
  defaultOurMissionEditableSections,
  isOurMissionFrameworkEditorialSection,
  isOurMissionLiveTrackerSection,
  isOurMissionProtectedSection,
  migrateOurMissionFullEditSections,
  prepareOurMissionAdminSections,
} from "./our-mission-page-sections";
import { prepareSectionsForSave } from "./sanitize";

describe("our-mission site builder sections", () => {
  it("provides full editable defaults with no protected or editorial flags", () => {
    const sections = defaultSectionsForPage("our-mission");
    expect(sections.map((s) => s.sectionKey)).toEqual([
      "hero",
      "tracker",
      "functions",
      "avenues-heading",
      "avenue-jonathan-training",
      "avenue-team-expansion",
      "avenue-national-partners",
      "beyond",
      "measurement",
      "invitation",
    ]);
    expect(String(sections[0]?.content.headline)).toBe(OUR_MISSION_HERO.title);
    expect(isOurMissionLiveTrackerSection(sections[1]!)).toBe(true);
    expect(sections.every((s) => !isOurMissionProtectedSection(s))).toBe(true);
    expect(sections.every((s) => !isOurMissionFrameworkEditorialSection(s))).toBe(true);
    expect(sections.every((s) => s.settings?.ministryFrameworkEditorial !== true)).toBe(true);
    expect(sections.every((s) => s.settings?.ministryFrameworkProtected !== true)).toBe(true);
  });

  it("seeds avenue qualification bullets from the framework", () => {
    const avenue = defaultOurMissionEditableSections().find(
      (s) => s.sectionKey === "avenue-jonathan-training",
    );
    expect(avenue?.settings?.ourMissionAvenue).toBe(true);
    const bullets = (avenue?.content.bullets as Array<{ text: string }>) ?? [];
    expect(bullets[0]?.text).toContain("Mobilized:");
    expect(bullets.length).toBeGreaterThanOrEqual(
      OUR_MISSION_AVENUES[0]!.tracks[0]!.qualifications.length,
    );
  });

  it("persists the full page including tracker presentation on save", () => {
    const sections = defaultOurMissionEditableSections();
    const saved = prepareSectionsForSave("our-mission", sections);
    expect(saved.map((s) => s.sectionKey)).toEqual(sections.map((s) => s.sectionKey));
    expect(saved.some(isOurMissionLiveTrackerSection)).toBe(true);
  });

  it("migrates older hero/beyond/invitation saves without overwriting copy", () => {
    const legacy = defaultOurMissionEditableSections()
      .filter((s) => ["hero", "beyond", "invitation"].includes(s.sectionKey))
      .map((section) =>
        section.sectionKey === "hero"
          ? {
              ...section,
              content: {
                ...section.content,
                headline: "Custom headline",
                body: "Custom body",
              },
            }
          : section,
      );

    const { sections, changed } = migrateOurMissionFullEditSections(legacy);
    expect(changed).toBe(true);
    expect(sections.map((s) => s.sectionKey)).toContain("functions");
    expect(sections.map((s) => s.sectionKey)).toContain("avenue-jonathan-training");
    expect(String(sections.find((s) => s.sectionKey === "hero")?.content.headline)).toBe(
      "Custom headline",
    );
  });

  it("preserves custom section order and content when already complete", () => {
    const full = defaultOurMissionEditableSections();
    const reordered = [
      full.find((s) => s.sectionKey === "invitation")!,
      ...full.filter((s) => s.sectionKey !== "invitation"),
    ].map((s, i) => ({
      ...s,
      sortOrder: i,
      content:
        s.sectionKey === "functions"
          ? { ...s.content, headline: "Custom functions heading" }
          : s.content,
    }));

    const { sections, changed } = migrateOurMissionFullEditSections(reordered);
    expect(changed).toBe(false);
    expect(sections[0]?.sectionKey).toBe("invitation");
    expect(String(sections.find((s) => s.sectionKey === "functions")?.content.headline)).toBe(
      "Custom functions heading",
    );
  });

  it("scrubs obsolete restriction settings without changing copy", () => {
    const withFlags = defaultOurMissionEditableSections().map((s) =>
      s.sectionKey === "functions"
        ? {
            ...s,
            settings: {
              ...s.settings,
              ministryFrameworkEditorial: true,
              ministryFrameworkProtected: true,
            },
            content: { ...s.content, headline: "Keep me" },
          }
        : s,
    );
    const { sections, changed } = migrateOurMissionFullEditSections(withFlags);
    expect(changed).toBe(true);
    const functions = sections.find((s) => s.sectionKey === "functions");
    expect(functions?.content.headline).toBe("Keep me");
    expect(functions?.settings?.ministryFrameworkEditorial).toBeUndefined();
    expect(functions?.settings?.ministryFrameworkProtected).toBeUndefined();
  });

  it("keeps supplemental editorial in its saved position when full page exists", () => {
    const full = defaultOurMissionEditableSections();
    const invitationIdx = full.findIndex((s) => s.sectionKey === "invitation");
    const withStory = [
      ...full.slice(0, invitationIdx),
      {
        id: "story",
        pageKey: "our-mission",
        sectionKey: "custom-story",
        sectionType: "text_section" as const,
        label: "Story",
        visible: true,
        sortOrder: invitationIdx,
        content: { headline: "A story", body: "Editorial" },
        settings: {},
      },
      ...full.slice(invitationIdx),
    ].map((s, i) => ({ ...s, sortOrder: i }));

    const prepared = prepareOurMissionAdminSections(withStory);
    const keys = prepared.map((s) => s.sectionKey);
    expect(keys.indexOf("custom-story")).toBe(keys.indexOf("invitation") - 1);
    expect(String(prepared.find((s) => s.sectionKey === "custom-story")?.content.headline)).toBe(
      "A story",
    );
  });

  it("is idempotent when already fully migrated", () => {
    const full = defaultOurMissionEditableSections();
    const first = migrateOurMissionFullEditSections(full);
    const second = migrateOurMissionFullEditSections(first.sections);
    expect(second.changed).toBe(false);
    expect(second.sections.map((s) => s.sectionKey)).toEqual(full.map((s) => s.sectionKey));
  });
});

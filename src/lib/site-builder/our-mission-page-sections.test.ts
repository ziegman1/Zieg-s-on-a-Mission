import { describe, expect, it } from "vitest";
import {
  OUR_MISSION_AVENUES,
  OUR_MISSION_CLOSING_CTA,
  OUR_MISSION_CTA_LEGACY,
  OUR_MISSION_HERO,
} from "@/data/our-mission-content";
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
      "vision-detail",
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

  it("defaults invitation to a single Ministry Funding CTA", () => {
    const invitation = defaultOurMissionEditableSections().find((s) => s.sectionKey === "invitation");
    expect(invitation?.content.primaryCtaLabel).toBe(OUR_MISSION_CLOSING_CTA.label);
    expect(invitation?.content.primaryCtaUrl).toBe("/ministry-funding");
    expect(invitation?.content.secondaryCtaLabel).toBe("");
    expect(invitation?.content.secondaryCtaUrl).toBe("");
  });

  it("seeds a compact hero with vision, intro CTA, and detail section", () => {
    const sections = defaultOurMissionEditableSections();
    const hero = sections.find((s) => s.sectionKey === "hero");
    const detail = sections.find((s) => s.sectionKey === "vision-detail");
    expect(hero?.content.body).toBe(OUR_MISSION_HERO.vision);
    expect(hero?.content.primaryCtaLabel).toBe(OUR_MISSION_CLOSING_CTA.label);
    expect(hero?.content.primaryCtaUrl).toBe("/ministry-funding");
    expect(detail?.content.body).toBe(OUR_MISSION_HERO.detail);
  });

  it("migrates legacy combined hero body into vision + detail", () => {
    const withoutDetail = defaultOurMissionEditableSections()
      .filter((s) => s.sectionKey !== "vision-detail")
      .map((section) =>
        section.sectionKey === "hero"
          ? {
              ...section,
              content: {
                ...section.content,
                body: OUR_MISSION_HERO.paragraphs.join("\n\n"),
                primaryCtaLabel: "",
                primaryCtaUrl: "",
              },
            }
          : section,
      );

    const { sections, changed } = migrateOurMissionFullEditSections(withoutDetail);
    expect(changed).toBe(true);
    const hero = sections.find((s) => s.sectionKey === "hero");
    const detail = sections.find((s) => s.sectionKey === "vision-detail");
    expect(hero?.content.body).toBe(OUR_MISSION_HERO.vision);
    expect(hero?.content.primaryCtaLabel).toBe(OUR_MISSION_CLOSING_CTA.label);
    expect(hero?.content.primaryCtaUrl).toBe("/ministry-funding");
    expect(detail?.content.body).toBe(OUR_MISSION_HERO.detail);
  });

  it("migrates legacy dual invitation CTAs to the single closing button", () => {
    const full = defaultOurMissionEditableSections();
    const legacy = full.map((section) =>
      section.sectionKey === "invitation"
        ? {
            ...section,
            content: {
              ...section.content,
              primaryCtaLabel: OUR_MISSION_CTA_LEGACY.primaryLabel,
              primaryCtaUrl: "/partner",
              secondaryCtaLabel: OUR_MISSION_CTA_LEGACY.secondaryLabel,
              secondaryCtaUrl: OUR_MISSION_CTA_LEGACY.secondaryUrl,
            },
          }
        : section,
    );

    const { sections, changed } = migrateOurMissionFullEditSections(legacy);
    expect(changed).toBe(true);
    const invitation = sections.find((s) => s.sectionKey === "invitation");
    expect(invitation?.content.primaryCtaLabel).toBe(OUR_MISSION_CLOSING_CTA.label);
    expect(invitation?.content.primaryCtaUrl).toBe("/ministry-funding");
    expect(invitation?.content.secondaryCtaLabel).toBe("");
    expect(invitation?.content.secondaryCtaUrl).toBe("");
  });

  it("seeds avenue cards without the measure-progress accordion fields", () => {
    const avenues = defaultOurMissionEditableSections().filter((s) =>
      String(s.sectionKey).startsWith("avenue-"),
    );
    expect(avenues).toHaveLength(OUR_MISSION_AVENUES.length);
    for (const avenue of avenues) {
      expect(avenue.settings?.ourMissionAvenue).toBe(true);
      expect(avenue.content.measureLabel).toBeUndefined();
      expect(avenue.content.bullets).toEqual([]);
      expect(String(avenue.content.headline)).toBeTruthy();
      expect(String(avenue.content.subheadline)).toBeTruthy();
      expect(String(avenue.content.body)).toBeTruthy();
    }
  });

  it("strips saved avenue measure accordion content without changing titles", () => {
    const seeded = defaultOurMissionEditableSections().map((section) =>
      section.sectionKey === "avenue-jonathan-training"
        ? {
            ...section,
            content: {
              ...section.content,
              measureLabel: "How We Measure Progress",
              bullets: [
                {
                  id: "q-1",
                  text: "Mobilized: Registers for Jonathan Training.",
                  visible: true,
                  sortOrder: 0,
                  metadata: { kind: "qualification", label: "Mobilized" },
                },
              ],
            },
          }
        : section,
    );
    const headline = String(
      seeded.find((s) => s.sectionKey === "avenue-jonathan-training")?.content.headline,
    );
    const { sections, changed } = migrateOurMissionFullEditSections(seeded);
    expect(changed).toBe(true);
    const avenue = sections.find((s) => s.sectionKey === "avenue-jonathan-training");
    expect(String(avenue?.content.headline)).toBe(headline);
    expect(avenue?.content.measureLabel).toBeUndefined();
    expect(avenue?.content.bullets).toEqual([]);
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

import { describe, expect, it } from "vitest";
import { defaultSectionsForPage } from "./defaults";
import {
  defaultMinistryFundingSections,
  isMinistryFundingAllocationSection,
  isMinistryFundingGoalsSection,
  migrateMinistryFundingSections,
  prepareMinistryFundingAdminSections,
} from "./ministry-funding-page-sections";
import { parseAllocationSection, parseFundingGoalsSection } from "@/lib/ministry-funding/from-sections";
import { MINISTRY_FUNDING_FUNCTIONS, MINISTRY_FUNDING_INVITATION } from "@/data/ministry-funding-content";

describe("ministry-funding site builder sections", () => {
  it("seeds seven starter functions with empty amounts (no fabricated figures)", () => {
    const sections = defaultMinistryFundingSections();
    const allocation = sections.find((s) => s.sectionKey === "allocation");
    expect(allocation).toBeDefined();
    expect(isMinistryFundingAllocationSection(allocation!)).toBe(true);

    const cards = allocation!.content.cards as Array<{
      text: string;
      metadata?: { amount?: string; body?: string };
    }>;
    expect(cards).toHaveLength(MINISTRY_FUNDING_FUNCTIONS.length);
    expect(cards.every((c) => c.metadata?.amount === "")).toBe(true);
    expect(cards.map((c) => c.text)).toEqual(MINISTRY_FUNDING_FUNCTIONS.map((f) => f.name));

    const parsed = parseAllocationSection(allocation!);
    expect(parsed?.derived.canPublishChart).toBe(false);
  });

  it("keeps funding goals incomplete until verified monthly inputs are set", () => {
    const goals = defaultMinistryFundingSections().find((s) => s.sectionKey === "funding-goals");
    expect(goals).toBeDefined();
    expect(isMinistryFundingGoalsSection(goals!)).toBe(true);
    expect(goals!.content.monthlyGoal).toBe("");
    expect(goals!.content.monthlyRecurring).toBe("");

    const view = parseFundingGoalsSection(goals!);
    expect(view?.derived.isComplete).toBe(false);
  });

  it("links invitation CTA to existing /give page", () => {
    const invitation = defaultMinistryFundingSections().find((s) => s.sectionKey === "invitation");
    expect(invitation?.content.primaryCtaUrl).toBe(MINISTRY_FUNDING_INVITATION.primaryCtaUrl);
    expect(invitation?.content.primaryCtaUrl).toBe("/give");
    expect(invitation?.content.primaryCtaLabel).toBe("Become a Financial Partner");
  });

  it("is registered in defaultSectionsForPage", () => {
    const sections = defaultSectionsForPage("ministry-funding");
    expect(sections.map((s) => s.sectionKey)).toEqual([
      "hero",
      "funding-goals",
      "functions-heading",
      "allocation",
      "invitation",
    ]);
  });

  it("migrates missing sections without overwriting existing content", () => {
    const [hero] = defaultMinistryFundingSections();
    const partial = [
      {
        ...hero!,
        content: { ...hero!.content, headline: "Custom headline" },
      },
    ];
    const migrated = migrateMinistryFundingSections(partial);
    expect(migrated.changed).toBe(true);
    expect(migrated.sections.map((s) => s.sectionKey)).toContain("funding-goals");
    expect(migrated.sections.find((s) => s.sectionKey === "hero")?.content.headline).toBe(
      "Custom headline",
    );
  });

  it("prepareMinistryFundingAdminSections returns defaults for empty storage", () => {
    const prepared = prepareMinistryFundingAdminSections([]);
    expect(prepared.length).toBe(defaultMinistryFundingSections().length);
  });
});

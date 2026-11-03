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
import {
  MINISTRY_FUNDING_CHART,
  MINISTRY_FUNDING_FUNCTIONS,
  MINISTRY_FUNDING_FUNCTIONS_INTRO,
  MINISTRY_FUNDING_INVITATION,
} from "@/data/ministry-funding-content";

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

  it("links invitation CTA to Mission Multiplied", () => {
    const invitation = defaultMinistryFundingSections().find((s) => s.sectionKey === "invitation");
    expect(invitation?.content.primaryCtaUrl).toBe(MINISTRY_FUNDING_INVITATION.primaryCtaUrl);
    expect(invitation?.content.primaryCtaUrl).toBe(
      "https://mission-multiplied.raiselysite.com/jeremy-ziegenhorn",
    );
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

  it("seeds and migrates the functions-heading intro under the primary heading", () => {
    const defaults = defaultMinistryFundingSections();
    const heading = defaults.find((s) => s.sectionKey === "functions-heading");
    expect(heading?.content.body).toBe(MINISTRY_FUNDING_FUNCTIONS_INTRO);

    const emptyBody = {
      ...heading!,
      content: { ...heading!.content, body: "" },
    };
    const migrated = migrateMinistryFundingSections([
      defaults.find((s) => s.sectionKey === "hero")!,
      emptyBody,
      defaults.find((s) => s.sectionKey === "allocation")!,
    ]);
    expect(migrated.changed).toBe(true);
    expect(
      migrated.sections.find((s) => s.sectionKey === "functions-heading")?.content.body,
    ).toBe(MINISTRY_FUNDING_FUNCTIONS_INTRO);
  });

  it("migrates legacy chart explanation, distinction, and invitation body", () => {
    const defaults = defaultMinistryFundingSections();
    const allocation = defaults.find((s) => s.sectionKey === "allocation")!;
    const invitation = defaults.find((s) => s.sectionKey === "invitation")!;
    const migrated = migrateMinistryFundingSections([
      {
        ...allocation,
        content: {
          ...allocation.content,
          intro:
            "These figures illustrate how ministry expenses are allocated across our seven areas of service. Direct expenses are assigned to their respective functions, while shared expenses are distributed according to recorded ministry time. Team Expansion Mission Share is included in Ministry Operations & Stewardship.",
          body: "This chart shows estimated ministry expense allocation. It is not a report of how individual donations were designated, and it is separate from our recurring financial partnership income progress above.",
        },
      },
      {
        ...invitation,
        content: {
          ...invitation.content,
          body: "Join us as we mobilize, train, and send 300 more workers by August 31, 2031, for the sake of reaching the unreached.",
        },
      },
    ]);
    expect(migrated.changed).toBe(true);
    const nextAllocation = migrated.sections.find((s) => s.sectionKey === "allocation")!;
    const nextInvitation = migrated.sections.find((s) => s.sectionKey === "invitation")!;
    expect(nextAllocation.content.intro).toBe(MINISTRY_FUNDING_CHART.explanation);
    expect(nextAllocation.content.body).toBe("");
    expect(nextInvitation.content.body).toBe(MINISTRY_FUNDING_INVITATION.body);
  });
});

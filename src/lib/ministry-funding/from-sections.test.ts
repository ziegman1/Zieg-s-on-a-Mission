import { describe, expect, it } from "vitest";
import { defaultMinistryFundingSections } from "@/lib/site-builder/ministry-funding-page-sections";
import { parseFundingGoalsSection } from "./from-sections";
import { patchSectionContent } from "@/lib/site-builder/patch-section";

describe("parseFundingGoalsSection", () => {
  it("starts incomplete with no seeded financial figures", () => {
    const goals = defaultMinistryFundingSections().find((s) => s.sectionKey === "funding-goals")!;
    const view = parseFundingGoalsSection(goals)!;
    expect(view.derived.isComplete).toBe(false);
    expect(view.derived.monthlyGoal).toBeNull();
    expect(view.derived.monthlyRecurring).toBeNull();
  });

  it("recalculates immediately when section content is patched (live preview source)", () => {
    const goals = defaultMinistryFundingSections().find((s) => s.sectionKey === "funding-goals")!;
    const withGoal = patchSectionContent(goals, "monthlyGoal", "10000");
    const withBoth = patchSectionContent(withGoal, "monthlyRecurring", "2500");
    const view = parseFundingGoalsSection(withBoth)!;

    expect(view.derived.isComplete).toBe(true);
    expect(view.derived.annualGoal).toBe(120000);
    expect(view.derived.annualizedRecurring).toBe(30000);
    expect(view.derived.remainingMonthly).toBe(7500);
    expect(view.derived.percentAchieved).toBe(25);
    expect(view.derived.progressBarPercent).toBe(25);
  });

  it("keeps blank distinct from explicit zero after patch", () => {
    const goals = defaultMinistryFundingSections().find((s) => s.sectionKey === "funding-goals")!;
    const blank = parseFundingGoalsSection(goals)!;
    expect(blank.derived.monthlyRecurring).toBeNull();

    const zeroed = parseFundingGoalsSection(patchSectionContent(goals, "monthlyRecurring", "0"))!;
    expect(zeroed.derived.monthlyRecurring).toBe(0);
    expect(zeroed.derived.isComplete).toBe(false);
  });
});

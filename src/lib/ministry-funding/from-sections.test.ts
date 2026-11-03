import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

  it("derives annual supporting figures from monthly Site Builder inputs", () => {
    const goals = defaultMinistryFundingSections().find((s) => s.sectionKey === "funding-goals")!;
    const view = parseFundingGoalsSection(
      patchSectionContent(
        patchSectionContent(goals, "monthlyGoal", "8000"),
        "monthlyRecurring",
        "4360",
      ),
    )!;
    expect(view.derived.annualGoal).toBe(96000);
    expect(view.derived.remainingAnnual).toBe(43680);
    expect(view.derived.percentAchieved).toBe(55);
  });
});

describe("funding goals compact layout contract", () => {
  it("renders three monthly cards plus annual supporting copy under the progress bar", () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        "src/components/ministry-funding/ministry-funding-editable-sections.tsx",
      ),
      "utf8",
    );
    expect(source).toContain('label="Monthly Funding Goal"');
    expect(source).toContain('label="Current Monthly Partnership"');
    expect(source).toContain('label="Remaining Monthly Need"');
    expect(source).toContain("sm:grid-cols-3");
    expect(source).toContain("Annual ministry budget:");
    expect(source).toContain("Annualized remaining need:");
    expect(source).toContain("% funded");
    expect(source).not.toContain('label="Annual Funding Goal"');
    expect(source).not.toContain('label="Annualized Recurring Partnership"');
    expect(source).not.toContain('label="Remaining Annualized Need"');
  });
});

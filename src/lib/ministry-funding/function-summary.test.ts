import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { MINISTRY_FUNDING_FUNCTIONS } from "@/data/ministry-funding-content";
import { defaultMinistryFundingSections } from "@/lib/site-builder/ministry-funding-page-sections";
import { parseAllocationSection } from "./from-sections";
import {
  ministryFunctionSummary,
  toggleExpandedFunctionId,
} from "./function-summary";

describe("ministryFunctionSummary", () => {
  it("uses the first sentence of each canonical function description", () => {
    for (const fn of MINISTRY_FUNDING_FUNCTIONS) {
      const summary = ministryFunctionSummary(fn.description);
      expect(summary.length).toBeGreaterThan(0);
      expect(summary.length).toBeLessThanOrEqual(fn.description.length);
      expect(fn.description.startsWith(summary.replace(/…$/, "")) || summary.endsWith("…")).toBe(
        true,
      );
    }
  });

  it("truncates long text at a word boundary with an ellipsis", () => {
    const long =
      "Building the prayer and financial partnerships that sustain workers through personal and church relationships, partner care, and clear ministry communication without ending early.";
    const summary = ministryFunctionSummary(long, 60);
    expect(summary.endsWith("…")).toBe(true);
    expect(summary.length).toBeLessThanOrEqual(61);
    expect(summary.includes("  ")).toBe(false);
  });

  it("returns empty for blank descriptions", () => {
    expect(ministryFunctionSummary("   ")).toBe("");
  });
});

describe("toggleExpandedFunctionId", () => {
  it("expands and collapses independently across functions", () => {
    let open = new Set<string>();
    open = toggleExpandedFunctionId(open, "mobilization");
    open = toggleExpandedFunctionId(open, "training-equipping");
    expect([...open].sort()).toEqual(["mobilization", "training-equipping"]);

    open = toggleExpandedFunctionId(open, "mobilization");
    expect([...open]).toEqual(["training-equipping"]);

    open = toggleExpandedFunctionId(open, "training-equipping");
    expect(open.size).toBe(0);
  });
});

describe("ministry function accordion content preservation", () => {
  it("keeps all seven canonical functions with authored descriptions and programs", () => {
    const allocation = defaultMinistryFundingSections().find((s) => s.sectionKey === "allocation")!;
    const view = parseAllocationSection(allocation)!;

    expect(view.descriptionFunctions).toHaveLength(7);
    expect(view.descriptionFunctions.map((f) => f.id)).toEqual(
      MINISTRY_FUNDING_FUNCTIONS.map((f) => f.id),
    );

    for (const canonical of MINISTRY_FUNDING_FUNCTIONS) {
      const card = view.descriptionFunctions.find((f) => f.id === canonical.id)!;
      expect(card.name).toBe(canonical.name);
      expect(card.description).toBe(canonical.description);
      expect(card.programs).toEqual(canonical.programs.map((p) => p.name));
      expect(card.color).toBe(canonical.defaultColor);
    }
  });

  it("does not hide Operations when allocation is zero / omitted from a snapshot chart set", () => {
    const allocation = defaultMinistryFundingSections().find((s) => s.sectionKey === "allocation")!;
    const withPartialChart = {
      ...allocation,
      content: {
        ...allocation.content,
        zoamSnapshot: {
          schemaVersion: "zoam-ministry-allocation/v1",
          sourceApplication: "PD Coaching OS",
          exportedAt: "2026-11-02T12:00:00.000Z",
          reportingMonth: "2026-10",
          reportingMonthLabel: "October 2026",
          allocationMethodology: "test",
          currency: "USD",
          scope: { household: "combined", label: "Combined" },
          ministryFunctions: [
            {
              name: "Mobilization",
              recordedTimeMinutes: 100,
              recordedTimePercentage: 100,
              directExpenseCents: 0,
              timeWeightedAllocatedExpenseCents: 10000,
              totalInvestmentCents: 10000,
              calculatedInvestmentPercentage: 100,
            },
          ],
          missionShare: { amountCents: 0, includedInReportedFinancialTotal: true },
          reportedMonthlyFinancialTotalCents: 10000,
          totalAllocatedInvestmentCents: 10000,
          reconciliation: {
            status: "reconciled",
            shortfallCents: 0,
            unallocatedExpensePoolCents: 0,
          },
          calculationWarnings: [],
        },
      },
    };

    const view = parseAllocationSection(withPartialChart)!;
    const ops = view.descriptionFunctions.find((f) => f.id === "operations-stewardship");
    expect(ops).toBeDefined();
    expect(ops?.description.length).toBeGreaterThan(20);
    expect(ops?.programs.length).toBeGreaterThan(0);
  });
});

describe("ministry function accordion accessibility contract", () => {
  it("uses expandable buttons with aria-expanded / aria-controls wiring", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/ministry-funding/ministry-function-accordion.tsx"),
      "utf8",
    );
    expect(source).toContain('type="button"');
    expect(source).toContain("aria-expanded={open}");
    expect(source).toContain("aria-controls={panelId}");
    expect(source).toContain('role="region"');
    expect(source).toContain("aria-labelledby={buttonId}");
    expect(source).toContain("ChevronDown");
    expect(source).toContain("toggleExpandedFunctionId");
  });

  it("is the presentation used by the public allocation section and Site Builder preview", () => {
    const sectionSource = readFileSync(
      resolve(
        process.cwd(),
        "src/components/ministry-funding/ministry-funding-editable-sections.tsx",
      ),
      "utf8",
    );
    expect(sectionSource).toContain("MinistryFunctionAccordion");
    expect(sectionSource).toContain("functions={view.descriptionFunctions}");
    expect(sectionSource).not.toContain('className="mt-12 grid gap-5 sm:grid-cols-2"');
  });
});

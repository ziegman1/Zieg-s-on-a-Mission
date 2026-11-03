import { describe, expect, it } from "vitest";
import { defaultMinistryFundingSections } from "@/lib/site-builder/ministry-funding-page-sections";
import { applyZoamSnapshotToAllocationSection } from "./apply-zoam-import";
import { parseAllocationSection, parseFundingGoalsSection } from "./from-sections";
import { patchSectionContent } from "@/lib/site-builder/patch-section";
import {
  recalculateInvestmentPercents,
  validateZoamMinistryAllocationImport,
} from "./zoam-import";
import {
  ZOAM_ALLOCATION_METHODOLOGY,
  ZOAM_EXPORT_CURRENCY,
  ZOAM_EXPORT_SOURCE_APPLICATION,
  ZOAM_MINISTRY_ALLOCATION_SCHEMA,
  type ZoamMinistryAllocationV1,
} from "./zoam-schema";
import { assertMinistryFundingAllocationSavable } from "./assert-allocation-savable";
import { derivePublicChartFromZoamSnapshot } from "./chart-presentation";
import { MINISTRY_FUNDING_CHART } from "@/data/ministry-funding-content";

/** Seven functions totaling $4,645 + Mission Share $350 → chart $4,995. */
const validSnapshot: ZoamMinistryAllocationV1 = (() => {
  const ministryFunctions = [
    {
      name: "Mobilization",
      recordedTimeMinutes: 200,
      recordedTimePercentage: 20,
      directExpenseCents: 50000,
      timeWeightedAllocatedExpenseCents: 60000,
      totalInvestmentCents: 110000,
      calculatedInvestmentPercentage: 23.68,
    },
    {
      name: "Training & Equipping",
      recordedTimeMinutes: 100,
      recordedTimePercentage: 10,
      directExpenseCents: 40000,
      timeWeightedAllocatedExpenseCents: 30000,
      totalInvestmentCents: 70000,
      calculatedInvestmentPercentage: 15.07,
    },
    {
      name: "Coaching & Development",
      recordedTimeMinutes: 150,
      recordedTimePercentage: 15,
      directExpenseCents: 30000,
      timeWeightedAllocatedExpenseCents: 45000,
      totalInvestmentCents: 75000,
      calculatedInvestmentPercentage: 16.15,
    },
    {
      name: "Leadership Development & Education",
      recordedTimeMinutes: 80,
      recordedTimePercentage: 8,
      directExpenseCents: 20000,
      timeWeightedAllocatedExpenseCents: 24000,
      totalInvestmentCents: 44000,
      calculatedInvestmentPercentage: 9.47,
    },
    {
      name: "Disciple-Making & Church Multiplication",
      recordedTimeMinutes: 120,
      recordedTimePercentage: 12,
      directExpenseCents: 25000,
      timeWeightedAllocatedExpenseCents: 36000,
      totalInvestmentCents: 61000,
      calculatedInvestmentPercentage: 13.13,
    },
    {
      name: "Partnership Development & Support Raising",
      recordedTimeMinutes: 200,
      recordedTimePercentage: 20,
      directExpenseCents: 35000,
      timeWeightedAllocatedExpenseCents: 60000,
      totalInvestmentCents: 95000,
      calculatedInvestmentPercentage: 20.45,
    },
    {
      name: "Ministry Operations & Stewardship",
      recordedTimeMinutes: 150,
      recordedTimePercentage: 15,
      directExpenseCents: 9500,
      timeWeightedAllocatedExpenseCents: 0,
      totalInvestmentCents: 9500,
      calculatedInvestmentPercentage: 2.05,
    },
  ];
  return {
    schemaVersion: ZOAM_MINISTRY_ALLOCATION_SCHEMA,
    sourceApplication: ZOAM_EXPORT_SOURCE_APPLICATION,
    exportedAt: "2025-11-02T18:00:00.000Z",
    reportingMonth: "2025-10",
    reportingMonthLabel: "October 2025",
    allocationMethodology: ZOAM_ALLOCATION_METHODOLOGY,
    currency: ZOAM_EXPORT_CURRENCY,
    scope: { household: "combined" as const, label: "Combined" as const },
    ministryFunctions,
    missionShare: {
      amountCents: 35000,
      includedInReportedFinancialTotal: true,
    },
    reportedMonthlyFinancialTotalCents: 499500,
    totalAllocatedInvestmentCents: 464500,
    reconciliation: {
      status: "reconciled" as const,
      shortfallCents: 0 as const,
      unallocatedExpensePoolCents: 0 as const,
    },
    calculationWarnings: [],
  };
})();

function json(value: unknown = validSnapshot) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

describe("validateZoamMinistryAllocationImport", () => {
  it("accepts a valid PD Coaching OS export and folds Mission Share into Operations", () => {
    const result = validateZoamMinistryAllocationImport(json());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.reportingMonth).toBe("2025-10");
    expect(result.preview.missionShareCents).toBe(35000);
    expect(result.preview.functions).toHaveLength(7);
    expect(result.preview.chartSlices).toHaveLength(7);
    expect(result.preview.missionShareFoldedIntoOperations).toBe(true);
    expect(result.preview.chartTotalInvestmentCents).toBe(499500);
    expect(result.preview.totalAllocatedInvestmentCents).toBe(464500);

    const ops = result.preview.functions.find((f) =>
      f.name.includes("Operations"),
    )!;
    expect(ops.sourceInvestmentCents).toBe(9500);
    expect(ops.totalInvestmentCents).toBe(44500);
    expect(ops.missionShareIncludedCents).toBe(35000);

    expect(result.preview.functions.map((f) => f.percent).reduce((a, b) => a + b, 0)).toBeCloseTo(
      100,
      5,
    );
    expect(result.preview.chartSlices.every((s) => s.amount > 0)).toBe(true);

    // Original snapshot preserved (Mission Share separate; ops not mutated).
    expect(result.snapshot.missionShare.amountCents).toBe(35000);
    expect(result.snapshot.totalAllocatedInvestmentCents).toBe(464500);
    expect(
      result.snapshot.ministryFunctions.find((f) => f.name.includes("Operations"))!
        .totalInvestmentCents,
    ).toBe(9500);
  });

  it("uses identical calculations for import preview and public chart presentation", () => {
    const result = validateZoamMinistryAllocationImport(json());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const presentation = derivePublicChartFromZoamSnapshot(result.snapshot);
    expect(presentation.ok).toBe(true);
    if (!presentation.ok) return;
    expect(result.preview.chartTotalInvestmentCents).toBe(presentation.chartTotalCents);
    expect(result.preview.chartSlices.map((s) => s.percent)).toEqual(
      presentation.slices.map((s) => s.percent),
    );
    expect(result.preview.chartSlices.map((s) => s.amount)).toEqual(
      presentation.slices.map((s) => s.amount),
    );
  });

  it("rejects invalid JSON", () => {
    const result = validateZoamMinistryAllocationImport("{not-json");
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Invalid JSON"))).toBe(true);
  });

  it("rejects unsupported schema versions", () => {
    const result = validateZoamMinistryAllocationImport(
      json({ ...validSnapshot, schemaVersion: "zoam-ministry-allocation/v0" }),
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Unsupported schemaVersion"))).toBe(true);
  });

  it("rejects missing required fields", () => {
    const { exportedAt: _e, ...rest } = validSnapshot;
    const result = validateZoamMinistryAllocationImport(json(rest));
    expect(result.ok).toBe(false);
  });

  it("rejects negative financial values", () => {
    const result = validateZoamMinistryAllocationImport(
      json({
        ...validSnapshot,
        missionShare: { ...validSnapshot.missionShare, amountCents: -1 },
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects incorrect reconciliation / shortfall / unallocated", () => {
    const badTotal = validateZoamMinistryAllocationImport(
      json({ ...validSnapshot, reportedMonthlyFinancialTotalCents: 999999 }),
    );
    expect(badTotal.ok).toBe(false);

    const shortfall = validateZoamMinistryAllocationImport(
      json({
        ...validSnapshot,
        reconciliation: { status: "reconciled", shortfallCents: 10, unallocatedExpensePoolCents: 0 },
      }),
    );
    expect(shortfall.ok).toBe(false);

    const unallocated = validateZoamMinistryAllocationImport(
      json({
        ...validSnapshot,
        reconciliation: { status: "reconciled", shortfallCents: 0, unallocatedExpensePoolCents: 5 },
      }),
    );
    expect(unallocated.ok).toBe(false);
  });

  it("accepts Mission Share excluded from the reported total and still folds into Operations", () => {
    const result = validateZoamMinistryAllocationImport(
      json({
        ...validSnapshot,
        missionShare: { amountCents: 35000, includedInReportedFinancialTotal: false },
        reportedMonthlyFinancialTotalCents: 464500,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.missionShareFoldedIntoOperations).toBe(true);
    expect(result.preview.chartTotalInvestmentCents).toBe(499500);
  });

  it("synthesizes Operations when omitted from source and still publishes a 7-function chart", () => {
    const withoutOps = {
      ...validSnapshot,
      ministryFunctions: validSnapshot.ministryFunctions.filter(
        (f) => !f.name.includes("Operations"),
      ),
      totalAllocatedInvestmentCents: 455000,
      reportedMonthlyFinancialTotalCents: 490000,
    };
    const result = validateZoamMinistryAllocationImport(json(withoutOps));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.functions).toHaveLength(7);
    expect(result.preview.chartSlices).toHaveLength(7);
    expect(result.preview.chartPublicationBlockedReason).toBeNull();
    expect(result.preview.chartTotalInvestmentCents).toBe(490000);
    const ops = result.preview.functions.find((f) => f.name.includes("Operations"))!;
    expect(ops.synthesizedFromCanonical).toBe(true);
    expect(ops.sourceInvestmentCents).toBe(0);
    expect(ops.totalInvestmentCents).toBe(35000);
    expect(ops.missionShareIncludedCents).toBe(35000);
    expect(
      result.issues.some((i) => i.severity === "info" && /omitted from the source/i.test(i.message)),
    ).toBe(true);
  });

  it("accepts the October 2026 production-shaped export (Ops omitted, MS excluded from reported)", () => {
    const october = {
      ...validSnapshot,
      reportingMonth: "2026-10",
      reportingMonthLabel: "October 2026",
      ministryFunctions: [
        {
          name: "Training & Equipping",
          recordedTimeMinutes: 6720,
          recordedTimePercentage: 46.67,
          directExpenseCents: 0,
          timeWeightedAllocatedExpenseCents: 216770,
          totalInvestmentCents: 216770,
          calculatedInvestmentPercentage: 46.67,
        },
        {
          name: "Coaching & Development",
          recordedTimeMinutes: 4095,
          recordedTimePercentage: 28.43,
          directExpenseCents: 0,
          timeWeightedAllocatedExpenseCents: 132094,
          totalInvestmentCents: 132094,
          calculatedInvestmentPercentage: 28.44,
        },
        {
          name: "Mobilization",
          recordedTimeMinutes: 1380,
          recordedTimePercentage: 9.58,
          directExpenseCents: 0,
          timeWeightedAllocatedExpenseCents: 44515,
          totalInvestmentCents: 44515,
          calculatedInvestmentPercentage: 9.58,
        },
        {
          name: "Partnership Development & Support Raising",
          recordedTimeMinutes: 1380,
          recordedTimePercentage: 9.58,
          directExpenseCents: 0,
          timeWeightedAllocatedExpenseCents: 44515,
          totalInvestmentCents: 44515,
          calculatedInvestmentPercentage: 9.58,
        },
        {
          name: "Leadership Development & Education",
          recordedTimeMinutes: 705,
          recordedTimePercentage: 4.89,
          directExpenseCents: 0,
          timeWeightedAllocatedExpenseCents: 22742,
          totalInvestmentCents: 22742,
          calculatedInvestmentPercentage: 4.9,
        },
        {
          name: "Disciple-Making & Church Multiplication",
          recordedTimeMinutes: 120,
          recordedTimePercentage: 0.83,
          directExpenseCents: 0,
          timeWeightedAllocatedExpenseCents: 3871,
          totalInvestmentCents: 3871,
          calculatedInvestmentPercentage: 0.83,
        },
      ],
      missionShare: { amountCents: 35000, includedInReportedFinancialTotal: false },
      reportedMonthlyFinancialTotalCents: 464507,
      totalAllocatedInvestmentCents: 464507,
    };
    const result = validateZoamMinistryAllocationImport(json(october));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.functions).toHaveLength(7);
    expect(result.preview.chartTotalInvestmentCents).toBe(499507);
    expect(result.preview.missionShareFoldedIntoOperations).toBe(true);
    expect(result.snapshot.ministryFunctions).toHaveLength(6);
  });

  it("rejects duplicate function names", () => {
    const result = validateZoamMinistryAllocationImport(
      json({
        ...validSnapshot,
        ministryFunctions: [
          validSnapshot.ministryFunctions[0],
          { ...validSnapshot.ministryFunctions[1], name: "Mobilization" },
          ...validSnapshot.ministryFunctions.slice(2),
        ],
        // totals intentionally wrong — duplicate check should fail first
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes("Duplicate"))).toBe(true);
  });

  it("allows zero-time functions with direct expenses", () => {
    const result = validateZoamMinistryAllocationImport(
      json({
        ...validSnapshot,
        ministryFunctions: [
          {
            name: "Mobilization",
            recordedTimeMinutes: 0,
            recordedTimePercentage: 0,
            directExpenseCents: 455000,
            timeWeightedAllocatedExpenseCents: 0,
            totalInvestmentCents: 455000,
            calculatedInvestmentPercentage: 98,
          },
          {
            name: "Ministry Operations & Stewardship",
            recordedTimeMinutes: 0,
            recordedTimePercentage: 0,
            directExpenseCents: 9500,
            timeWeightedAllocatedExpenseCents: 0,
            totalInvestmentCents: 9500,
            calculatedInvestmentPercentage: 2,
          },
        ],
        missionShare: { amountCents: 35000, includedInReportedFinancialTotal: true },
        reportedMonthlyFinancialTotalCents: 499500,
        totalAllocatedInvestmentCents: 464500,
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.chartTotalInvestmentCents).toBe(499500);
  });

  it("rejects private/forbidden fields", () => {
    const result = validateZoamMinistryAllocationImport(
      json({ ...validSnapshot, householdId: "secret" }),
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes("householdId"))).toBe(true);
  });

  it("warns on older months and requires confirmation to replace", () => {
    const result = validateZoamMinistryAllocationImport(json(), {
      reportingMonthKey: "2025-11",
      snapshot: {
        ...validSnapshot,
        reportingMonth: "2025-11",
        reportingMonthLabel: "November 2025",
        exportedAt: "2025-12-01T00:00:00.000Z",
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.compare.isOlderThanCurrent).toBe(true);
    expect(result.compare.requiresConfirmation).toBe(true);
  });

  it("treats identical snapshots as informational (no reimport required)", () => {
    const result = validateZoamMinistryAllocationImport(json(), {
      snapshot: validSnapshot,
      reportingMonthKey: "2025-10",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.compare.isIdenticalDuplicate).toBe(true);
    expect(result.issues.some((i) => i.severity === "error")).toBe(false);
    expect(
      result.issues.some(
        (i) => i.severity === "info" && /No reimport is needed/i.test(i.message),
      ),
    ).toBe(true);
    expect(result.preview.chartSlices).toHaveLength(7);
  });
});

describe("recalculateInvestmentPercents", () => {
  it("sums to 100 for positive totals", () => {
    const slices = recalculateInvestmentPercents([
      { name: "A", totalInvestmentCents: 660000 },
      { name: "B", totalInvestmentCents: 290000 },
    ]);
    expect(slices.reduce((s, x) => s + x.percent, 0)).toBeCloseTo(100, 5);
  });
});

describe("applyZoamSnapshotToAllocationSection", () => {
  it("applies amounts, preserves descriptions, folds Mission Share for chart, and does not touch funding goals", () => {
    const sections = defaultMinistryFundingSections();
    const goals = sections.find((s) => s.sectionKey === "funding-goals")!;
    const goalsWithValues = patchSectionContent(
      patchSectionContent(goals, "monthlyGoal", "10000"),
      "monthlyRecurring",
      "2500",
    );
    const allocation = sections.find((s) => s.sectionKey === "allocation")!;
    expect(allocation.content.intro).toBe(MINISTRY_FUNDING_CHART.explanation);

    const validated = validateZoamMinistryAllocationImport(json());
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    const applied = applyZoamSnapshotToAllocationSection(allocation, validated.snapshot);
    const view = parseAllocationSection(applied)!;
    expect(view.derived.canPublishChart).toBe(true);
    expect(view.reportingMonth).toBe("October 2025");
    expect(view.zoamSnapshot?.schemaVersion).toBe(ZOAM_MINISTRY_ALLOCATION_SCHEMA);
    expect(view.chartPresentation?.ok).toBe(true);
    expect(view.derived.slices).toHaveLength(7);
    expect(view.derived.slices.reduce((s, x) => s + x.percent, 0)).toBeCloseTo(100, 5);

    const opsSlice = view.derived.slices.find((s) => s.name.includes("Operations"));
    expect(opsSlice?.amount).toBe(445);

    // Source snapshot on the section is the original PD export (ops still $95).
    expect(view.zoamSnapshot?.missionShare.amountCents).toBe(35000);
    expect(
      view.zoamSnapshot?.ministryFunctions.find((f) => f.name.includes("Operations"))
        ?.totalInvestmentCents,
    ).toBe(9500);

    const mobilization = view.functions.find((f) => f.name === "Mobilization");
    expect(mobilization?.description.length).toBeGreaterThan(20);
    expect(mobilization?.amount).toBe(1100);

    // Funding goals untouched when allocation is applied in isolation.
    const funding = parseFundingGoalsSection(goalsWithValues)!;
    expect(funding.derived.monthlyGoal).toBe(10000);
    expect(funding.derived.monthlyRecurring).toBe(2500);

    const all = sections.map((s) =>
      s.sectionKey === "allocation" ? applied : s.sectionKey === "funding-goals" ? goalsWithValues : s,
    );
    expect(assertMinistryFundingAllocationSavable(all).ok).toBe(true);
  });

  it("renders existing snapshots with corrected chart calculation without reimport", () => {
    const allocation = defaultMinistryFundingSections().find((s) => s.sectionKey === "allocation")!;
    const withSnapshot = {
      ...allocation,
      content: {
        ...allocation.content,
        zoamSnapshot: validSnapshot,
        reportingMonth: validSnapshot.reportingMonthLabel,
        reportingMonthKey: validSnapshot.reportingMonth,
      },
    };
    const view = parseAllocationSection(withSnapshot)!;
    expect(view.derived.canPublishChart).toBe(true);
    expect(view.derived.slices).toHaveLength(7);
    expect(view.chartPresentation?.ok && view.chartPresentation.chartTotalCents).toBe(499500);
  });

  it("publishes charts for existing snapshots that omit Operations (presentation synthesizes it)", () => {
    const withoutOps = {
      ...validSnapshot,
      ministryFunctions: validSnapshot.ministryFunctions.filter(
        (f) => !f.name.includes("Operations"),
      ),
      totalAllocatedInvestmentCents: 455000,
      reportedMonthlyFinancialTotalCents: 490000,
    };
    const allocation = defaultMinistryFundingSections().find((s) => s.sectionKey === "allocation")!;
    const applied = applyZoamSnapshotToAllocationSection(allocation, withoutOps);
    const view = parseAllocationSection(applied)!;
    expect(view.zoamSnapshot).not.toBeNull();
    expect(view.zoamSnapshot?.ministryFunctions).toHaveLength(6);
    expect(view.derived.reconciliationOk).toBe(true);
    expect(view.chartPresentation?.ok).toBe(true);
    expect(view.derived.canPublishChart).toBe(true);
    expect(view.derived.slices).toHaveLength(7);
    expect(view.chartPresentation?.ok && view.chartPresentation.operationsSynthesized).toBe(true);
    expect(view.chartPresentation?.ok && view.chartPresentation.chartTotalCents).toBe(490000);

    // Descriptions / programs on canonical cards are preserved.
    const opsCard = view.functions.find((f) => f.id === "operations-stewardship");
    expect(opsCard?.description.length).toBeGreaterThan(20);
    expect(opsCard?.programs.length).toBeGreaterThan(0);
  });

  it("renders the October 2026 saved snapshot with Mission Share in Operations without reimport", () => {
    const october = {
      schemaVersion: ZOAM_MINISTRY_ALLOCATION_SCHEMA,
      sourceApplication: "PD Coaching OS" as const,
      exportedAt: "2026-11-02T12:00:00.000Z",
      reportingMonth: "2026-10",
      reportingMonthLabel: "October 2026",
      allocationMethodology: "test",
      currency: "USD" as const,
      scope: { household: "combined" as const, label: "Combined" as const },
      ministryFunctions: [
        {
          name: "Training & Equipping",
          recordedTimeMinutes: 6720,
          recordedTimePercentage: 46.67,
          directExpenseCents: 0,
          timeWeightedAllocatedExpenseCents: 216770,
          totalInvestmentCents: 216770,
          calculatedInvestmentPercentage: 46.67,
        },
        {
          name: "Coaching & Development",
          recordedTimeMinutes: 4095,
          recordedTimePercentage: 28.43,
          directExpenseCents: 0,
          timeWeightedAllocatedExpenseCents: 132094,
          totalInvestmentCents: 132094,
          calculatedInvestmentPercentage: 28.44,
        },
        {
          name: "Mobilization",
          recordedTimeMinutes: 1380,
          recordedTimePercentage: 9.58,
          directExpenseCents: 0,
          timeWeightedAllocatedExpenseCents: 44515,
          totalInvestmentCents: 44515,
          calculatedInvestmentPercentage: 9.58,
        },
        {
          name: "Partnership Development & Support Raising",
          recordedTimeMinutes: 1380,
          recordedTimePercentage: 9.58,
          directExpenseCents: 0,
          timeWeightedAllocatedExpenseCents: 44515,
          totalInvestmentCents: 44515,
          calculatedInvestmentPercentage: 9.58,
        },
        {
          name: "Leadership Development & Education",
          recordedTimeMinutes: 705,
          recordedTimePercentage: 4.89,
          directExpenseCents: 0,
          timeWeightedAllocatedExpenseCents: 22742,
          totalInvestmentCents: 22742,
          calculatedInvestmentPercentage: 4.9,
        },
        {
          name: "Disciple-Making & Church Multiplication",
          recordedTimeMinutes: 120,
          recordedTimePercentage: 0.83,
          directExpenseCents: 0,
          timeWeightedAllocatedExpenseCents: 3871,
          totalInvestmentCents: 3871,
          calculatedInvestmentPercentage: 0.83,
        },
      ],
      missionShare: { amountCents: 35000, includedInReportedFinancialTotal: false },
      reportedMonthlyFinancialTotalCents: 464507,
      totalAllocatedInvestmentCents: 464507,
      reconciliation: {
        status: "reconciled" as const,
        shortfallCents: 0 as const,
        unallocatedExpensePoolCents: 0 as const,
      },
      calculationWarnings: [],
    };
    const allocation = defaultMinistryFundingSections().find((s) => s.sectionKey === "allocation")!;
    const withSnapshot = {
      ...allocation,
      content: {
        ...allocation.content,
        zoamSnapshot: october,
        reportingMonth: "October 2026",
        reportingMonthKey: "2026-10",
      },
    };
    const view = parseAllocationSection(withSnapshot)!;
    expect(view.derived.canPublishChart).toBe(true);
    expect(view.derived.slices).toHaveLength(7);
    expect(view.chartPresentation?.ok && view.chartPresentation.chartTotalCents).toBe(499507);
    const ops = view.derived.slices.find((s) => s.name.includes("Operations"));
    expect(ops?.amount).toBe(350);
  });

  it("keeps draft zoam data out of empty defaults (no invented chart)", () => {
    const allocation = defaultMinistryFundingSections().find((s) => s.sectionKey === "allocation")!;
    const view = parseAllocationSection(allocation)!;
    expect(view.zoamSnapshot).toBeNull();
    expect(view.derived.canPublishChart).toBe(false);
  });
});

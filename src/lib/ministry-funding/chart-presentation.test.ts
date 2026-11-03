import { describe, expect, it } from "vitest";
import {
  derivePublicChartFromManualFunctions,
  derivePublicChartFromZoamSnapshot,
  missionShareAlreadyCountedInFunctionTotals,
  OPERATIONS_STEWARDSHIP_FUNCTION_ID,
  resolveCanonicalFunctionId,
} from "./chart-presentation";
import {
  ZOAM_ALLOCATION_METHODOLOGY,
  ZOAM_EXPORT_CURRENCY,
  ZOAM_EXPORT_SOURCE_APPLICATION,
  ZOAM_MINISTRY_ALLOCATION_SCHEMA,
  type ZoamMinistryAllocationV1,
} from "./zoam-schema";

/** Example: functions $4,645 + Mission Share $350 → chart $4,995. */
function sevenFunctionSnapshot(
  overrides?: Partial<ZoamMinistryAllocationV1>,
): ZoamMinistryAllocationV1 {
  const ministryFunctions = [
    {
      name: "Mobilization",
      recordedTimeMinutes: 200,
      recordedTimePercentage: 20,
      directExpenseCents: 50000,
      timeWeightedAllocatedExpenseCents: 60000,
      totalInvestmentCents: 110000,
      calculatedInvestmentPercentage: 0,
    },
    {
      name: "Training & Equipping",
      recordedTimeMinutes: 100,
      recordedTimePercentage: 10,
      directExpenseCents: 40000,
      timeWeightedAllocatedExpenseCents: 30000,
      totalInvestmentCents: 70000,
      calculatedInvestmentPercentage: 0,
    },
    {
      name: "Coaching & Development",
      recordedTimeMinutes: 150,
      recordedTimePercentage: 15,
      directExpenseCents: 30000,
      timeWeightedAllocatedExpenseCents: 45000,
      totalInvestmentCents: 75000,
      calculatedInvestmentPercentage: 0,
    },
    {
      name: "Leadership Development & Education",
      recordedTimeMinutes: 80,
      recordedTimePercentage: 8,
      directExpenseCents: 20000,
      timeWeightedAllocatedExpenseCents: 24000,
      totalInvestmentCents: 44000,
      calculatedInvestmentPercentage: 0,
    },
    {
      name: "Disciple-Making & Church Multiplication",
      recordedTimeMinutes: 120,
      recordedTimePercentage: 12,
      directExpenseCents: 25000,
      timeWeightedAllocatedExpenseCents: 36000,
      totalInvestmentCents: 61000,
      calculatedInvestmentPercentage: 0,
    },
    {
      name: "Partnership Development & Support Raising",
      recordedTimeMinutes: 200,
      recordedTimePercentage: 20,
      directExpenseCents: 35000,
      timeWeightedAllocatedExpenseCents: 60000,
      totalInvestmentCents: 95000,
      calculatedInvestmentPercentage: 0,
    },
    {
      name: "Ministry Operations & Stewardship",
      recordedTimeMinutes: 150,
      recordedTimePercentage: 15,
      directExpenseCents: 9500,
      timeWeightedAllocatedExpenseCents: 0,
      totalInvestmentCents: 9500,
      calculatedInvestmentPercentage: 0,
    },
  ];

  const missionShareCents = 35000;
  const totalAllocated = 464500;

  return {
    schemaVersion: ZOAM_MINISTRY_ALLOCATION_SCHEMA,
    sourceApplication: ZOAM_EXPORT_SOURCE_APPLICATION,
    exportedAt: "2025-11-02T18:00:00.000Z",
    reportingMonth: "2025-10",
    reportingMonthLabel: "October 2025",
    allocationMethodology: ZOAM_ALLOCATION_METHODOLOGY,
    currency: ZOAM_EXPORT_CURRENCY,
    scope: { household: "combined", label: "Combined" },
    ministryFunctions,
    missionShare: {
      amountCents: missionShareCents,
      includedInReportedFinancialTotal: true,
    },
    reportedMonthlyFinancialTotalCents: totalAllocated + missionShareCents,
    totalAllocatedInvestmentCents: totalAllocated,
    reconciliation: {
      status: "reconciled",
      shortfallCents: 0,
      unallocatedExpensePoolCents: 0,
    },
    calculationWarnings: [],
    ...overrides,
  };
}

describe("resolveCanonicalFunctionId", () => {
  it("resolves Operations by id and by documented aliases", () => {
    expect(
      resolveCanonicalFunctionId({ id: "operations-stewardship", name: "Anything" }),
    ).toBe(OPERATIONS_STEWARDSHIP_FUNCTION_ID);
    expect(
      resolveCanonicalFunctionId({ name: "Ministry Operations & Stewardship" }),
    ).toBe(OPERATIONS_STEWARDSHIP_FUNCTION_ID);
    expect(resolveCanonicalFunctionId({ name: "Ministry Operations" })).toBe(
      OPERATIONS_STEWARDSHIP_FUNCTION_ID,
    );
  });
});

describe("derivePublicChartFromZoamSnapshot", () => {
  it("folds Mission Share into Operations and keeps seven functions totaling 100%", () => {
    const snapshot = sevenFunctionSnapshot();
    const originalJson = JSON.stringify(snapshot);

    const result = derivePublicChartFromZoamSnapshot(snapshot);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.functions).toHaveLength(7);
    expect(result.slices).toHaveLength(7);
    expect(result.chartTotalCents).toBe(499500);
    expect(result.missionShareFoldedIntoOperations).toBe(true);

    const ops = result.functions.find(
      (f) => f.canonicalId === OPERATIONS_STEWARDSHIP_FUNCTION_ID,
    )!;
    expect(ops.sourceInvestmentCents).toBe(9500);
    expect(ops.missionShareIncludedCents).toBe(35000);
    expect(ops.displayInvestmentCents).toBe(44500);

    const percentSum = result.slices.reduce((s, x) => s + x.percent, 0);
    expect(percentSum).toBeCloseTo(100, 5);

    // Source snapshot must remain unchanged (no silent mutation).
    expect(JSON.stringify(snapshot)).toBe(originalJson);
    expect(snapshot.missionShare.amountCents).toBe(35000);
    expect(snapshot.totalAllocatedInvestmentCents).toBe(464500);
    expect(
      snapshot.ministryFunctions.find((f) => f.name.includes("Operations"))!
        .totalInvestmentCents,
    ).toBe(9500);
  });

  it("does not double-count Mission Share when already embedded in function totals", () => {
    const base = sevenFunctionSnapshot();
    const alreadyCounted: ZoamMinistryAllocationV1 = {
      ...base,
      ministryFunctions: base.ministryFunctions.map((f) =>
        f.name.includes("Operations")
          ? { ...f, totalInvestmentCents: f.totalInvestmentCents + 35000 }
          : f,
      ),
      totalAllocatedInvestmentCents: 499500,
      reportedMonthlyFinancialTotalCents: 499500,
      missionShare: {
        amountCents: 35000,
        includedInReportedFinancialTotal: true,
      },
    };

    expect(missionShareAlreadyCountedInFunctionTotals(alreadyCounted)).toBe(true);

    const result = derivePublicChartFromZoamSnapshot(alreadyCounted);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.missionShareFoldedIntoOperations).toBe(false);
    expect(result.chartTotalCents).toBe(499500);
    const ops = result.functions.find(
      (f) => f.canonicalId === OPERATIONS_STEWARDSHIP_FUNCTION_ID,
    )!;
    expect(ops.missionShareIncludedCents).toBe(0);
    expect(ops.displayInvestmentCents).toBe(ops.sourceInvestmentCents);
  });

  it("blocks chart publication when Operations cannot be identified", () => {
    const snapshot = sevenFunctionSnapshot({
      ministryFunctions: sevenFunctionSnapshot().ministryFunctions.filter(
        (f) => !f.name.includes("Operations"),
      ),
      totalAllocatedInvestmentCents: 455000,
      reportedMonthlyFinancialTotalCents: 490000,
    });

    const result = derivePublicChartFromZoamSnapshot(snapshot);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/operations/i);
    expect(result.slices).toHaveLength(0);
  });
});

describe("derivePublicChartFromManualFunctions", () => {
  it("folds Mission Share into the operations-stewardship card by id", () => {
    const result = derivePublicChartFromManualFunctions({
      functions: [
        { id: "mobilization", name: "Mobilization", amountCents: 10000 },
        {
          id: "operations-stewardship",
          name: "Ministry Operations & Stewardship",
          amountCents: 5000,
        },
      ],
      missionShareCents: 35000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.chartTotalCents).toBe(50000);
    expect(result.functions[1]!.displayInvestmentCents).toBe(40000);
    expect(result.functions[1]!.missionShareIncludedCents).toBe(35000);
  });

  it("blocks when Operations is missing from manual cards", () => {
    const result = derivePublicChartFromManualFunctions({
      functions: [{ id: "mobilization", name: "Mobilization", amountCents: 10000 }],
      missionShareCents: 35000,
    });
    expect(result.ok).toBe(false);
  });
});

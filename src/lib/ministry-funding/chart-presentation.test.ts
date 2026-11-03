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
import { MINISTRY_FUNDING_FUNCTIONS } from "@/data/ministry-funding-content";

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

/** Production-shaped October 2026 export: Ops omitted (zero), MS excluded from reported. */
function october2026Snapshot(): ZoamMinistryAllocationV1 {
  return {
    schemaVersion: ZOAM_MINISTRY_ALLOCATION_SCHEMA,
    sourceApplication: ZOAM_EXPORT_SOURCE_APPLICATION,
    exportedAt: "2026-11-02T12:00:00.000Z",
    reportingMonth: "2026-10",
    reportingMonthLabel: "October 2026",
    allocationMethodology: ZOAM_ALLOCATION_METHODOLOGY,
    currency: ZOAM_EXPORT_CURRENCY,
    scope: { household: "combined", label: "Combined" },
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
    missionShare: {
      amountCents: 35000,
      includedInReportedFinancialTotal: false,
    },
    reportedMonthlyFinancialTotalCents: 464507,
    totalAllocatedInvestmentCents: 464507,
    reconciliation: {
      status: "reconciled",
      shortfallCents: 0,
      unallocatedExpensePoolCents: 0,
    },
    calculationWarnings: [],
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
    expect(resolveCanonicalFunctionId({ name: "Operations & Stewardship" })).toBe(
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
    expect(result.operationsSynthesized).toBe(false);

    const ops = result.functions.find(
      (f) => f.canonicalId === OPERATIONS_STEWARDSHIP_FUNCTION_ID,
    )!;
    expect(ops.sourceInvestmentCents).toBe(9500);
    expect(ops.missionShareIncludedCents).toBe(35000);
    expect(ops.displayInvestmentCents).toBe(44500);

    const percentSum = result.slices.reduce((s, x) => s + x.percent, 0);
    expect(percentSum).toBeCloseTo(100, 5);

    expect(JSON.stringify(snapshot)).toBe(originalJson);
  });

  it("synthesizes Operations when absent from source and folds Mission Share once", () => {
    const snapshot = october2026Snapshot();
    const originalJson = JSON.stringify(snapshot);
    const result = derivePublicChartFromZoamSnapshot(snapshot);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.functions).toHaveLength(7);
    expect(result.functions.map((f) => f.canonicalId)).toEqual(
      MINISTRY_FUNDING_FUNCTIONS.map((f) => f.id),
    );
    expect(result.operationsSynthesized).toBe(true);
    expect(result.missionShareFoldedIntoOperations).toBe(true);
    expect(result.chartTotalCents).toBe(499507);

    const ops = result.functions.find(
      (f) => f.canonicalId === OPERATIONS_STEWARDSHIP_FUNCTION_ID,
    )!;
    expect(ops.synthesizedFromCanonical).toBe(true);
    expect(ops.sourceInvestmentCents).toBe(0);
    expect(ops.missionShareIncludedCents).toBe(35000);
    expect(ops.displayInvestmentCents).toBe(35000);

    expect(result.slices.reduce((s, x) => s + x.percent, 0)).toBeCloseTo(100, 5);
    expect(JSON.stringify(snapshot)).toBe(originalJson);
    expect(snapshot.ministryFunctions).toHaveLength(6);
  });

  it("uses Operations under a known alias and adds Mission Share once", () => {
    const snapshot = sevenFunctionSnapshot({
      ministryFunctions: sevenFunctionSnapshot().ministryFunctions.map((f) =>
        f.name.includes("Operations")
          ? { ...f, name: "Operations & Stewardship" }
          : f,
      ),
    });
    const result = derivePublicChartFromZoamSnapshot(snapshot);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.operationsSynthesized).toBe(false);
    const ops = result.functions.find(
      (f) => f.canonicalId === OPERATIONS_STEWARDSHIP_FUNCTION_ID,
    )!;
    expect(ops.name).toBe("Operations & Stewardship");
    expect(ops.displayInvestmentCents).toBe(44500);
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

  it("treats Mission Share as additional when excluded from the reported total", () => {
    const snapshot = sevenFunctionSnapshot({
      missionShare: { amountCents: 35000, includedInReportedFinancialTotal: false },
      reportedMonthlyFinancialTotalCents: 464500,
    });
    const result = derivePublicChartFromZoamSnapshot(snapshot);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.missionShareFoldedIntoOperations).toBe(true);
    expect(result.chartTotalCents).toBe(499500);
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
    expect(result.functions).toHaveLength(7);
    expect(result.chartTotalCents).toBe(50000);
    const ops = result.functions.find(
      (f) => f.canonicalId === OPERATIONS_STEWARDSHIP_FUNCTION_ID,
    )!;
    expect(ops.displayInvestmentCents).toBe(40000);
    expect(ops.missionShareIncludedCents).toBe(35000);
  });

  it("synthesizes Operations when missing from manual cards", () => {
    const result = derivePublicChartFromManualFunctions({
      functions: [{ id: "mobilization", name: "Mobilization", amountCents: 10000 }],
      missionShareCents: 35000,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.operationsSynthesized).toBe(true);
    expect(result.chartTotalCents).toBe(45000);
    expect(result.functions).toHaveLength(7);
  });
});

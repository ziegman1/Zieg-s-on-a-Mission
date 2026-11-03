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
  ZOAM_EXPORT_CURRENCY,
  ZOAM_EXPORT_SOURCE_APPLICATION,
  ZOAM_MINISTRY_ALLOCATION_SCHEMA,
  type ZoamMinistryAllocationV1,
} from "./zoam-schema";
import { assertMinistryFundingAllocationSavable } from "./assert-allocation-savable";

const validSnapshot: ZoamMinistryAllocationV1 = {
  schemaVersion: ZOAM_MINISTRY_ALLOCATION_SCHEMA,
  sourceApplication: ZOAM_EXPORT_SOURCE_APPLICATION,
  exportedAt: "2025-11-02T18:00:00.000Z",
  reportingMonth: "2025-10",
  reportingMonthLabel: "October 2025",
  allocationMethodology:
    "pool = reported monthly total − Mission Share (only when the reported total includes it) − direct ministry expenses; time-weighted allocated expense(f) = pool × recorded minutes(f) ÷ household minutes (exact minutes, largest-remainder cents); total investment(f) = time-weighted allocated expense(f) + direct expense(f). Mission Share is never reassigned to ministry functions.",
  currency: ZOAM_EXPORT_CURRENCY,
  scope: { household: "combined", label: "Combined" },
  ministryFunctions: [
    {
      name: "Mobilization",
      recordedTimeMinutes: 700,
      recordedTimePercentage: 70,
      directExpenseCents: 100000,
      timeWeightedAllocatedExpenseCents: 560000,
      totalInvestmentCents: 660000,
      calculatedInvestmentPercentage: 69.47,
    },
    {
      name: "Training & Equipping",
      recordedTimeMinutes: 300,
      recordedTimePercentage: 30,
      directExpenseCents: 50000,
      timeWeightedAllocatedExpenseCents: 240000,
      totalInvestmentCents: 290000,
      calculatedInvestmentPercentage: 30.53,
    },
  ],
  missionShare: {
    amountCents: 50000,
    includedInReportedFinancialTotal: true,
  },
  reportedMonthlyFinancialTotalCents: 1000000,
  totalAllocatedInvestmentCents: 950000,
  reconciliation: {
    status: "reconciled",
    shortfallCents: 0,
    unallocatedExpensePoolCents: 0,
  },
  calculationWarnings: [],
};

function json(value: unknown = validSnapshot) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

describe("validateZoamMinistryAllocationImport", () => {
  it("accepts a valid PD Coaching OS export and recalculates percentages", () => {
    const result = validateZoamMinistryAllocationImport(json());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.reportingMonth).toBe("2025-10");
    expect(result.preview.missionShareCents).toBe(50000);
    expect(result.preview.functions.map((f) => f.percent).reduce((a, b) => a + b, 0)).toBeCloseTo(
      100,
      5,
    );
    expect(result.preview.chartSlices.every((s) => s.amount > 0)).toBe(true);
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

  it("accepts Mission Share excluded from the reported total", () => {
    const result = validateZoamMinistryAllocationImport(
      json({
        ...validSnapshot,
        missionShare: { amountCents: 50000, includedInReportedFinancialTotal: false },
        reportedMonthlyFinancialTotalCents: 950000,
      }),
    );
    expect(result.ok).toBe(true);
  });

  it("rejects duplicate function names", () => {
    const result = validateZoamMinistryAllocationImport(
      json({
        ...validSnapshot,
        ministryFunctions: [
          validSnapshot.ministryFunctions[0],
          { ...validSnapshot.ministryFunctions[1], name: "Mobilization" },
        ],
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
            directExpenseCents: 950000,
            timeWeightedAllocatedExpenseCents: 0,
            totalInvestmentCents: 950000,
            calculatedInvestmentPercentage: 100,
          },
        ],
        missionShare: { amountCents: 50000, includedInReportedFinancialTotal: true },
        reportedMonthlyFinancialTotalCents: 1000000,
        totalAllocatedInvestmentCents: 950000,
      }),
    );
    expect(result.ok).toBe(true);
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

  it("rejects identical duplicate imports", () => {
    const result = validateZoamMinistryAllocationImport(json(), {
      snapshot: validSnapshot,
      reportingMonthKey: "2025-10",
    });
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.message.includes("identical"))).toBe(true);
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
  it("applies amounts, preserves descriptions, and does not touch funding goals", () => {
    const sections = defaultMinistryFundingSections();
    const goals = sections.find((s) => s.sectionKey === "funding-goals")!;
    const goalsWithValues = patchSectionContent(
      patchSectionContent(goals, "monthlyGoal", "10000"),
      "monthlyRecurring",
      "2500",
    );
    const allocation = sections.find((s) => s.sectionKey === "allocation")!;
    const validated = validateZoamMinistryAllocationImport(json());
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    const applied = applyZoamSnapshotToAllocationSection(allocation, validated.snapshot);
    const view = parseAllocationSection(applied)!;
    expect(view.derived.canPublishChart).toBe(true);
    expect(view.reportingMonth).toBe("October 2025");
    expect(view.zoamSnapshot?.schemaVersion).toBe(ZOAM_MINISTRY_ALLOCATION_SCHEMA);

    const mobilization = view.functions.find((f) => f.name === "Mobilization");
    expect(mobilization?.description.length).toBeGreaterThan(20);
    expect(mobilization?.amount).toBe(6600);

    // Funding goals untouched when allocation is applied in isolation.
    const funding = parseFundingGoalsSection(goalsWithValues)!;
    expect(funding.derived.monthlyGoal).toBe(10000);
    expect(funding.derived.monthlyRecurring).toBe(2500);

    const all = sections.map((s) =>
      s.sectionKey === "allocation" ? applied : s.sectionKey === "funding-goals" ? goalsWithValues : s,
    );
    expect(assertMinistryFundingAllocationSavable(all).ok).toBe(true);
  });

  it("keeps draft zoam data out of empty defaults (no invented chart)", () => {
    const allocation = defaultMinistryFundingSections().find((s) => s.sectionKey === "allocation")!;
    const view = parseAllocationSection(allocation)!;
    expect(view.zoamSnapshot).toBeNull();
    expect(view.derived.canPublishChart).toBe(false);
  });
});

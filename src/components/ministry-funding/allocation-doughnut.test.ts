import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { chartInvestmentTotal } from "./allocation-doughnut";
import { formatUsd } from "@/lib/ministry-funding/calculations";
import { derivePublicChartFromZoamSnapshot } from "@/lib/ministry-funding/chart-presentation";
import {
  ZOAM_ALLOCATION_METHODOLOGY,
  ZOAM_EXPORT_CURRENCY,
  ZOAM_EXPORT_SOURCE_APPLICATION,
  ZOAM_MINISTRY_ALLOCATION_SCHEMA,
} from "@/lib/ministry-funding/zoam-schema";
import { MINISTRY_FUNDING_CHART, MINISTRY_FUNDING_INVITATION } from "@/data/ministry-funding-content";

const october2026 = {
  schemaVersion: ZOAM_MINISTRY_ALLOCATION_SCHEMA,
  sourceApplication: ZOAM_EXPORT_SOURCE_APPLICATION,
  exportedAt: "2026-11-02T12:00:00.000Z",
  reportingMonth: "2026-10",
  reportingMonthLabel: "October 2026",
  allocationMethodology: ZOAM_ALLOCATION_METHODOLOGY,
  currency: ZOAM_EXPORT_CURRENCY,
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

describe("chartInvestmentTotal", () => {
  it("matches the public chart total for October 2026 including Mission Share once", () => {
    const presentation = derivePublicChartFromZoamSnapshot(october2026);
    expect(presentation.ok).toBe(true);
    if (!presentation.ok) return;

    expect(presentation.slices).toHaveLength(7);
    expect(presentation.missionShareFoldedIntoOperations).toBe(true);
    expect(chartInvestmentTotal(presentation.slices)).toBe(presentation.chartTotalCents / 100);
    expect(formatUsd(chartInvestmentTotal(presentation.slices))).toBe("$4,995");
    expect(presentation.operationsSynthesized).toBe(true);
  });

  it("updates when Mission Share / month totals change after a new import", () => {
    const presentation = derivePublicChartFromZoamSnapshot({
      ...october2026,
      reportingMonth: "2026-11",
      reportingMonthLabel: "November 2026",
      missionShare: { amountCents: 50000, includedInReportedFinancialTotal: false },
    });
    expect(presentation.ok).toBe(true);
    if (!presentation.ok) return;
    expect(chartInvestmentTotal(presentation.slices)).toBe(5145.07);
    expect(formatUsd(chartInvestmentTotal(presentation.slices))).toBe("$5,145");
  });
});

describe("ministry funding chart presentation contract", () => {
  it("uses an enlarged doughnut with center total wiring on public and import preview", () => {
    const doughnut = readFileSync(
      resolve(process.cwd(), "src/components/ministry-funding/allocation-doughnut.tsx"),
      "utf8",
    );
    expect(doughnut).toContain("const size = 260");
    expect(doughnut).toContain("centerTotalLabel");
    expect(doughnut).toContain("centerSubtitle");
    expect(doughnut).toContain("Total monthly ministry investment");

    const page = readFileSync(
      resolve(
        process.cwd(),
        "src/components/ministry-funding/ministry-funding-editable-sections.tsx",
      ),
      "utf8",
    );
    expect(page).toContain("centerTotalLabel={formatUsd(chartInvestmentTotal(coloredSlices))}");
    expect(page).toContain("centerSubtitle={view.reportingMonth.trim() || null}");

    const importPanel = readFileSync(
      resolve(process.cwd(), "src/components/admin/ministry-allocation-import-panel.tsx"),
      "utf8",
    );
    expect(importPanel).toContain("centerSubtitle={result.preview.reportingMonthLabel}");
  });

  it("keeps a single consolidated chart explanation and updated invitation CTA destination", () => {
    expect(MINISTRY_FUNDING_CHART.explanation).toBe(
      "This chart illustrates how ministry expenses support our seven areas of service. Direct expenses are assigned to their respective functions, while shared expenses are allocated according to recorded ministry time. Team Expansion Mission Share is included in Ministry Operations & Stewardship.",
    );
    expect(MINISTRY_FUNDING_CHART.distinction).toBe("");
    expect(MINISTRY_FUNDING_INVITATION.body).toContain("Together, we're mobilizing");
    expect(MINISTRY_FUNDING_INVITATION.primaryCtaUrl).toBe("/give");
    expect(MINISTRY_FUNDING_INVITATION.primaryCtaLabel).toBe("Become a Financial Partner");
  });
});

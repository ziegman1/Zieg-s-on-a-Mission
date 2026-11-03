import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defaultMinistryFundingSections } from "@/lib/site-builder/ministry-funding-page-sections";
import { applyZoamSnapshotToAllocationSection } from "@/lib/ministry-funding/apply-zoam-import";
import { validateZoamMinistryAllocationImport } from "@/lib/ministry-funding/zoam-import";
import {
  ZOAM_EXPORT_CURRENCY,
  ZOAM_EXPORT_SOURCE_APPLICATION,
  ZOAM_MINISTRY_ALLOCATION_SCHEMA,
  type ZoamMinistryAllocationV1,
} from "@/lib/ministry-funding/zoam-schema";
import { monthLabelFromAllocationSection } from "./ministry-funding-allocation-toolbar";

const snapshot: ZoamMinistryAllocationV1 = {
  schemaVersion: ZOAM_MINISTRY_ALLOCATION_SCHEMA,
  sourceApplication: ZOAM_EXPORT_SOURCE_APPLICATION,
  exportedAt: "2025-11-02T18:00:00.000Z",
  reportingMonth: "2025-10",
  reportingMonthLabel: "October 2025",
  allocationMethodology: "test",
  currency: ZOAM_EXPORT_CURRENCY,
  scope: { household: "combined", label: "Combined" },
  ministryFunctions: [
    {
      name: "Mobilization",
      recordedTimeMinutes: 100,
      recordedTimePercentage: 100,
      directExpenseCents: 0,
      timeWeightedAllocatedExpenseCents: 950000,
      totalInvestmentCents: 950000,
      calculatedInvestmentPercentage: 100,
    },
  ],
  missionShare: { amountCents: 50000, includedInReportedFinancialTotal: true },
  reportedMonthlyFinancialTotalCents: 1000000,
  totalAllocatedInvestmentCents: 950000,
  reconciliation: { status: "reconciled", shortfallCents: 0, unallocatedExpensePoolCents: 0 },
  calculationWarnings: [],
};

describe("Ministry Funding allocation toolbar helpers", () => {
  it("reads empty month labels from defaults", () => {
    const allocation = defaultMinistryFundingSections().find((s) => s.sectionKey === "allocation");
    expect(monthLabelFromAllocationSection(allocation)).toEqual({ key: null, label: null });
  });

  it("reads draft month after apply-to-draft", () => {
    const allocation = defaultMinistryFundingSections().find((s) => s.sectionKey === "allocation")!;
    const validated = validateZoamMinistryAllocationImport(JSON.stringify(snapshot));
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const applied = applyZoamSnapshotToAllocationSection(allocation, validated.snapshot);
    expect(monthLabelFromAllocationSection(applied)).toEqual({
      key: "2025-10",
      label: "October 2025",
    });
  });

  it("keeps a single import entry point in the Site Builder editor toolbar", () => {
    const editor = readFileSync(
      resolve(process.cwd(), "src/app/admin/site-builder/site-builder-editor.tsx"),
      "utf8",
    );
    const props = readFileSync(
      resolve(process.cwd(), "src/app/admin/site-builder/section-properties-panel.tsx"),
      "utf8",
    );
    expect(editor).toContain("MinistryFundingAllocationToolbar");
    expect(editor).toContain('activePage === "ministry-funding"');
    expect(props).not.toContain("MinistryAllocationImportPanel");
    expect(props).toContain("Ministry Allocation Data");
  });
});

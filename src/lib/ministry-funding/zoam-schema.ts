/**
 * Contract for PD Coaching OS `zoam-ministry-allocation/v1` paste imports.
 * Field names and units match docs/ministry-allocation/zoam-export-schema.md
 * in pd-coaching-os-ma-fin (READ ONLY reference).
 */

export const ZOAM_MINISTRY_ALLOCATION_SCHEMA = "zoam-ministry-allocation/v1" as const;
export const ZOAM_EXPORT_SOURCE_APPLICATION = "PD Coaching OS" as const;
export const ZOAM_EXPORT_CURRENCY = "USD" as const;

export const ZOAM_ALLOCATION_METHODOLOGY =
  "pool = reported monthly total − Mission Share (only when the reported total includes it) − direct ministry expenses; " +
  "time-weighted allocated expense(f) = pool × recorded minutes(f) ÷ household minutes (exact minutes, largest-remainder cents); " +
  "total investment(f) = time-weighted allocated expense(f) + direct expense(f). " +
  "Mission Share is never reassigned to ministry functions.";

export type ZoamMinistryFunctionV1 = {
  name: string;
  recordedTimeMinutes: number;
  recordedTimePercentage: number;
  directExpenseCents: number;
  timeWeightedAllocatedExpenseCents: number;
  totalInvestmentCents: number;
  calculatedInvestmentPercentage: number;
};

export type ZoamMinistryAllocationV1 = {
  schemaVersion: typeof ZOAM_MINISTRY_ALLOCATION_SCHEMA;
  sourceApplication: typeof ZOAM_EXPORT_SOURCE_APPLICATION;
  exportedAt: string;
  reportingMonth: string;
  reportingMonthLabel: string;
  allocationMethodology: string;
  currency: typeof ZOAM_EXPORT_CURRENCY;
  scope: {
    household: "combined";
    label: "Combined";
  };
  ministryFunctions: ZoamMinistryFunctionV1[];
  missionShare: {
    amountCents: number;
    includedInReportedFinancialTotal: boolean;
  };
  reportedMonthlyFinancialTotalCents: number;
  totalAllocatedInvestmentCents: number;
  reconciliation: {
    status: "reconciled";
    shortfallCents: 0;
    unallocatedExpensePoolCents: 0;
  };
  calculationWarnings: string[];
};

/** Keys that must never appear in a publishable snapshot (privacy). */
export const ZOAM_PRIVACY_FORBIDDEN_KEYS = [
  "householdId",
  "household_id",
  "userId",
  "user_id",
  "workerId",
  "worker_id",
  "people",
  "password",
  "credential",
  "donor",
  "recruit",
  "note",
  "notes",
  "entryId",
  "expenseId",
] as const;

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function normalizeFunctionName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

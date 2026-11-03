/**
 * Public chart presentation for ministry allocation.
 *
 * Source ZOAM snapshots keep Mission Share separate (PD Coaching OS contract).
 * For the public seven-function chart, Mission Share is assigned only to
 * Ministry Operations & Stewardship — never as an 8th slice, and never twice.
 */

import { MINISTRY_FUNDING_FUNCTIONS } from "@/data/ministry-funding-content";
import {
  recalculateInvestmentPercents,
  type AllocationSlice,
} from "./calculations";
import {
  centsToDollars,
  normalizeFunctionName,
  type ZoamMinistryAllocationV1,
} from "./zoam-schema";

export const OPERATIONS_STEWARDSHIP_FUNCTION_ID = "operations-stewardship" as const;

/** Canonical ZOAM function ids used for stable chart mapping. */
export type CanonicalMinistryFunctionId = (typeof MINISTRY_FUNDING_FUNCTIONS)[number]["id"];

/**
 * Documented name aliases → canonical ids.
 * Prefer id match; names are fallback for PD exports that only ship display names.
 */
export const CANONICAL_FUNCTION_NAME_ALIASES: Record<CanonicalMinistryFunctionId, readonly string[]> =
  {
    mobilization: ["mobilization"],
    "training-equipping": ["training & equipping", "training and equipping", "training"],
    "coaching-development": ["coaching & development", "coaching and development", "coaching"],
    "leadership-education": [
      "leadership development & education",
      "leadership development and education",
      "leadership development",
    ],
    "disciple-making": [
      "disciple-making & church multiplication",
      "disciple-making and church multiplication",
      "disciple-making",
      "disciple making",
    ],
    "partnership-development": [
      "partnership development & support raising",
      "partnership development and support raising",
      "partnership development",
      "partner development",
    ],
    "operations-stewardship": [
      "ministry operations & stewardship",
      "ministry operations and stewardship",
      "operations & stewardship",
      "operations and stewardship",
      "ministry operations",
      "operations",
      "administration",
    ],
  };

export type ChartPresentationFunction = {
  id: string;
  canonicalId: CanonicalMinistryFunctionId | null;
  name: string;
  /** Original investment cents from the snapshot (before Mission Share fold-in). */
  sourceInvestmentCents: number;
  /** Display investment cents after Mission Share assignment. */
  displayInvestmentCents: number;
  /** Mission Share cents folded into this row (0 for non-operations). */
  missionShareIncludedCents: number;
  percent: number;
};

export type ChartPresentationResult =
  | {
      ok: true;
      slices: AllocationSlice[];
      functions: ChartPresentationFunction[];
      /** Chart total in cents (function investments + Mission Share when folded in). */
      chartTotalCents: number;
      missionShareCents: number;
      missionShareFoldedIntoOperations: boolean;
      missionShareAlreadyInSourceTotals: boolean;
      operationsFunctionId: string;
      operationsFunctionName: string;
    }
  | {
      ok: false;
      error: string;
      slices: [];
      functions: [];
      chartTotalCents: number;
      missionShareCents: number;
      missionShareFoldedIntoOperations: false;
      missionShareAlreadyInSourceTotals: boolean;
      operationsFunctionId: null;
      operationsFunctionName: null;
    };

export function resolveCanonicalFunctionId(input: {
  id?: string | null;
  name: string;
}): CanonicalMinistryFunctionId | null {
  const id = (input.id ?? "").trim().toLowerCase();
  if (MINISTRY_FUNDING_FUNCTIONS.some((f) => f.id === id)) {
    return id as CanonicalMinistryFunctionId;
  }
  const normalized = normalizeFunctionName(input.name);
  for (const fn of MINISTRY_FUNDING_FUNCTIONS) {
    if (normalizeFunctionName(fn.name) === normalized) return fn.id;
    const aliases = CANONICAL_FUNCTION_NAME_ALIASES[fn.id] ?? [];
    if (aliases.some((a) => a === normalized)) return fn.id;
  }
  return null;
}

/**
 * Detect whether Mission Share cents are already embedded in function totals
 * (defensive — normal PD exports keep Mission Share outside function rows).
 */
export function missionShareAlreadyCountedInFunctionTotals(
  snapshot: ZoamMinistryAllocationV1,
): boolean {
  const ms = snapshot.missionShare.amountCents;
  if (ms <= 0) return true;

  const functionSum = snapshot.ministryFunctions.reduce(
    (s, f) => s + f.totalInvestmentCents,
    0,
  );

  // Functions already equal the full reported total that claims to include Mission Share.
  if (
    snapshot.missionShare.includedInReportedFinancialTotal &&
    functionSum === snapshot.reportedMonthlyFinancialTotalCents
  ) {
    return true;
  }

  // Function sum already equals allocated investment + Mission Share.
  if (functionSum === snapshot.totalAllocatedInvestmentCents + ms) {
    return true;
  }

  return false;
}

export function derivePublicChartFromZoamSnapshot(
  snapshot: ZoamMinistryAllocationV1,
): ChartPresentationResult {
  const ms = snapshot.missionShare.amountCents;
  const alreadyIn = missionShareAlreadyCountedInFunctionTotals(snapshot);
  const mustFold = ms > 0 && !alreadyIn;

  const mapped = snapshot.ministryFunctions.map((f, index) => {
    const canonicalId = resolveCanonicalFunctionId({ name: f.name });
    return {
      index,
      name: f.name,
      canonicalId,
      sourceInvestmentCents: f.totalInvestmentCents,
    };
  });

  const operations = mapped.find((m) => m.canonicalId === OPERATIONS_STEWARDSHIP_FUNCTION_ID);

  if (mustFold && !operations) {
    return {
      ok: false,
      error:
        "Cannot publish the ministry investment chart: Team Expansion Mission Share must be included in Ministry Operations & Stewardship, but that function could not be identified in the imported snapshot. Ensure the export includes Ministry Operations & Stewardship (id: operations-stewardship).",
      slices: [],
      functions: [],
      chartTotalCents: snapshot.totalAllocatedInvestmentCents,
      missionShareCents: ms,
      missionShareFoldedIntoOperations: false,
      missionShareAlreadyInSourceTotals: alreadyIn,
      operationsFunctionId: null,
      operationsFunctionName: null,
    };
  }

  const displayRows = mapped.map((m) => {
    const addMs =
      mustFold && m.canonicalId === OPERATIONS_STEWARDSHIP_FUNCTION_ID ? ms : 0;
    return {
      id: m.canonicalId ?? `fn-${m.index}`,
      canonicalId: m.canonicalId,
      name: m.name,
      sourceInvestmentCents: m.sourceInvestmentCents,
      displayInvestmentCents: m.sourceInvestmentCents + addMs,
      missionShareIncludedCents: addMs,
    };
  });

  const chartTotalCents = displayRows.reduce((s, r) => s + r.displayInvestmentCents, 0);
  const percentSlices = recalculateInvestmentPercents(
    displayRows.map((r) => ({
      name: r.name,
      totalInvestmentCents: r.displayInvestmentCents,
    })),
  );

  const functions: ChartPresentationFunction[] = displayRows.map((r, i) => ({
    ...r,
    percent: percentSlices[i]?.percent ?? 0,
  }));

  const slices: AllocationSlice[] = percentSlices.map((s, i) => ({
    id: displayRows[i]!.id,
    name: s.name,
    amount: centsToDollars(displayRows[i]!.displayInvestmentCents),
    percent: s.percent,
  }));

  return {
    ok: true,
    slices,
    functions,
    chartTotalCents,
    missionShareCents: ms,
    missionShareFoldedIntoOperations: mustFold,
    missionShareAlreadyInSourceTotals: alreadyIn,
    operationsFunctionId: operations?.canonicalId ?? OPERATIONS_STEWARDSHIP_FUNCTION_ID,
    operationsFunctionName: operations?.name ?? "Ministry Operations & Stewardship",
  };
}

/**
 * Manual (non-snapshot) chart presentation: fold section Mission Share into the
 * operations-stewardship card when present.
 */
export function derivePublicChartFromManualFunctions(input: {
  functions: Array<{ id: string; name: string; amountCents: number }>;
  missionShareCents: number;
}): ChartPresentationResult {
  const ms = Math.max(0, input.missionShareCents);
  const mapped = input.functions.map((f, index) => ({
    index,
    id: f.id,
    name: f.name,
    canonicalId: resolveCanonicalFunctionId({ id: f.id, name: f.name }),
    sourceInvestmentCents: f.amountCents,
  }));

  const functionSum = mapped.reduce((s, m) => s + m.sourceInvestmentCents, 0);
  const alreadyIn = ms > 0 && functionSum > 0 && false; // manual amounts are function-only
  const mustFold = ms > 0 && !alreadyIn;
  const operations = mapped.find((m) => m.canonicalId === OPERATIONS_STEWARDSHIP_FUNCTION_ID);

  if (mustFold && !operations) {
    return {
      ok: false,
      error:
        "Cannot publish the ministry investment chart: Mission Share must be included in Ministry Operations & Stewardship, but that function was not found among the allocation cards.",
      slices: [],
      functions: [],
      chartTotalCents: functionSum,
      missionShareCents: ms,
      missionShareFoldedIntoOperations: false,
      missionShareAlreadyInSourceTotals: false,
      operationsFunctionId: null,
      operationsFunctionName: null,
    };
  }

  const displayRows = mapped.map((m) => {
    const addMs =
      mustFold && m.canonicalId === OPERATIONS_STEWARDSHIP_FUNCTION_ID ? ms : 0;
    return {
      id: m.canonicalId ?? m.id,
      canonicalId: m.canonicalId,
      name: m.name,
      sourceInvestmentCents: m.sourceInvestmentCents,
      displayInvestmentCents: m.sourceInvestmentCents + addMs,
      missionShareIncludedCents: addMs,
    };
  });

  const chartTotalCents = displayRows.reduce((s, r) => s + r.displayInvestmentCents, 0);
  const percentSlices = recalculateInvestmentPercents(
    displayRows.map((r) => ({
      name: r.name,
      totalInvestmentCents: r.displayInvestmentCents,
    })),
  );

  return {
    ok: true,
    slices: percentSlices.map((s, i) => ({
      id: displayRows[i]!.id,
      name: s.name,
      amount: centsToDollars(displayRows[i]!.displayInvestmentCents),
      percent: s.percent,
    })),
    functions: displayRows.map((r, i) => ({
      ...r,
      percent: percentSlices[i]?.percent ?? 0,
    })),
    chartTotalCents,
    missionShareCents: ms,
    missionShareFoldedIntoOperations: mustFold,
    missionShareAlreadyInSourceTotals: alreadyIn,
    operationsFunctionId: operations?.canonicalId ?? OPERATIONS_STEWARDSHIP_FUNCTION_ID,
    operationsFunctionName: operations?.name ?? "Ministry Operations & Stewardship",
  };
}

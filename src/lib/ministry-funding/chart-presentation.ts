/**
 * Public chart presentation for ministry allocation.
 *
 * Source ZOAM snapshots keep Mission Share separate (PD Coaching OS contract).
 * For the public seven-function chart, Mission Share is assigned only to
 * Ministry Operations & Stewardship — never as an 8th slice, and never twice.
 *
 * PD exports may omit zero-allocation functions. Presentation synthesizes those
 * missing canonical rows (especially Operations) without mutating the snapshot.
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
  type ZoamMinistryFunctionV1,
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
  canonicalId: CanonicalMinistryFunctionId;
  name: string;
  /** Original investment cents from the snapshot (0 when synthesized). */
  sourceInvestmentCents: number;
  /** Display investment cents after Mission Share assignment. */
  displayInvestmentCents: number;
  /** Mission Share cents folded into this row (0 for non-operations). */
  missionShareIncludedCents: number;
  /** True when this row was added for presentation because the source omitted it. */
  synthesizedFromCanonical: boolean;
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
      /** True when Operations was absent from the source and synthesized at $0. */
      operationsSynthesized: boolean;
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
      operationsSynthesized: false;
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

function buildCanonicalDisplayRows(input: {
  sourceByCanonical: Map<
    CanonicalMinistryFunctionId,
    { name: string; sourceInvestmentCents: number }
  >;
  missionShareCents: number;
  alreadyIn: boolean;
}): {
  displayRows: Array<{
    id: CanonicalMinistryFunctionId;
    canonicalId: CanonicalMinistryFunctionId;
    name: string;
    sourceInvestmentCents: number;
    displayInvestmentCents: number;
    missionShareIncludedCents: number;
    synthesizedFromCanonical: boolean;
  }>;
  mustFold: boolean;
  operationsSynthesized: boolean;
} {
  const ms = Math.max(0, input.missionShareCents);
  const mustFold = ms > 0 && !input.alreadyIn;

  const displayRows = MINISTRY_FUNDING_FUNCTIONS.map((fn) => {
    const source = input.sourceByCanonical.get(fn.id);
    const sourceInvestmentCents = source?.sourceInvestmentCents ?? 0;
    const synthesizedFromCanonical = !source;
    const addMs = mustFold && fn.id === OPERATIONS_STEWARDSHIP_FUNCTION_ID ? ms : 0;
    return {
      id: fn.id,
      canonicalId: fn.id,
      name: source?.name ?? fn.name,
      sourceInvestmentCents,
      displayInvestmentCents: sourceInvestmentCents + addMs,
      missionShareIncludedCents: addMs,
      synthesizedFromCanonical,
    };
  });

  const operations = displayRows.find((r) => r.canonicalId === OPERATIONS_STEWARDSHIP_FUNCTION_ID)!;

  return {
    displayRows,
    mustFold,
    operationsSynthesized: operations.synthesizedFromCanonical,
  };
}

function finalizePresentation(input: {
  displayRows: Array<{
    id: string;
    canonicalId: CanonicalMinistryFunctionId;
    name: string;
    sourceInvestmentCents: number;
    displayInvestmentCents: number;
    missionShareIncludedCents: number;
    synthesizedFromCanonical: boolean;
  }>;
  missionShareCents: number;
  mustFold: boolean;
  alreadyIn: boolean;
  operationsSynthesized: boolean;
}): ChartPresentationResult {
  const chartTotalCents = input.displayRows.reduce((s, r) => s + r.displayInvestmentCents, 0);
  const percentSlices = recalculateInvestmentPercents(
    input.displayRows.map((r) => ({
      name: r.name,
      totalInvestmentCents: r.displayInvestmentCents,
    })),
  );

  const operations = input.displayRows.find(
    (r) => r.canonicalId === OPERATIONS_STEWARDSHIP_FUNCTION_ID,
  )!;

  return {
    ok: true,
    slices: percentSlices.map((s, i) => ({
      id: input.displayRows[i]!.id,
      name: s.name,
      amount: centsToDollars(input.displayRows[i]!.displayInvestmentCents),
      percent: s.percent,
    })),
    functions: input.displayRows.map((r, i) => ({
      ...r,
      percent: percentSlices[i]?.percent ?? 0,
    })),
    chartTotalCents,
    missionShareCents: input.missionShareCents,
    missionShareFoldedIntoOperations: input.mustFold,
    missionShareAlreadyInSourceTotals: input.alreadyIn,
    operationsFunctionId: OPERATIONS_STEWARDSHIP_FUNCTION_ID,
    operationsFunctionName: operations.name,
    operationsSynthesized: input.operationsSynthesized,
  };
}

function indexSourceFunctions(
  functions: Array<{ id?: string; name: string; totalInvestmentCents: number }>,
): Map<CanonicalMinistryFunctionId, { name: string; sourceInvestmentCents: number }> {
  const sourceByCanonical = new Map<
    CanonicalMinistryFunctionId,
    { name: string; sourceInvestmentCents: number }
  >();

  for (const f of functions) {
    const canonicalId = resolveCanonicalFunctionId({ id: f.id, name: f.name });
    if (!canonicalId) continue;
    const existing = sourceByCanonical.get(canonicalId);
    if (existing) {
      sourceByCanonical.set(canonicalId, {
        name: existing.name,
        sourceInvestmentCents: existing.sourceInvestmentCents + f.totalInvestmentCents,
      });
    } else {
      sourceByCanonical.set(canonicalId, {
        name: f.name,
        sourceInvestmentCents: f.totalInvestmentCents,
      });
    }
  }

  return sourceByCanonical;
}

export function derivePublicChartFromZoamSnapshot(
  snapshot: ZoamMinistryAllocationV1,
): ChartPresentationResult {
  const ms = snapshot.missionShare.amountCents;
  const alreadyIn = missionShareAlreadyCountedInFunctionTotals(snapshot);
  const sourceByCanonical = indexSourceFunctions(
    snapshot.ministryFunctions.map((f: ZoamMinistryFunctionV1) => ({
      name: f.name,
      totalInvestmentCents: f.totalInvestmentCents,
    })),
  );

  const built = buildCanonicalDisplayRows({
    sourceByCanonical,
    missionShareCents: ms,
    alreadyIn,
  });

  return finalizePresentation({
    displayRows: built.displayRows,
    missionShareCents: ms,
    mustFold: built.mustFold,
    alreadyIn,
    operationsSynthesized: built.operationsSynthesized,
  });
}

/**
 * Manual (non-snapshot) chart presentation: fold section Mission Share into the
 * operations-stewardship card. Missing canonical functions are synthesized at $0.
 */
export function derivePublicChartFromManualFunctions(input: {
  functions: Array<{ id: string; name: string; amountCents: number }>;
  missionShareCents: number;
}): ChartPresentationResult {
  const ms = Math.max(0, input.missionShareCents);
  const sourceByCanonical = indexSourceFunctions(
    input.functions.map((f) => ({
      id: f.id,
      name: f.name,
      totalInvestmentCents: f.amountCents,
    })),
  );
  const alreadyIn = false;
  const built = buildCanonicalDisplayRows({
    sourceByCanonical,
    missionShareCents: ms,
    alreadyIn,
  });

  return finalizePresentation({
    displayRows: built.displayRows,
    missionShareCents: ms,
    mustFold: built.mustFold,
    alreadyIn,
    operationsSynthesized: built.operationsSynthesized,
  });
}

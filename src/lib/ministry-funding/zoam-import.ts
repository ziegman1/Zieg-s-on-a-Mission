/**
 * Validate and preview PD Coaching OS `zoam-ministry-allocation/v1` paste payloads.
 * Percentages are always recalculated from cents — never trusted from the payload.
 */

import {
  recalculateInvestmentPercents,
  type AllocationSlice,
} from "./calculations";
import {
  derivePublicChartFromZoamSnapshot,
  OPERATIONS_STEWARDSHIP_FUNCTION_ID,
  resolveCanonicalFunctionId,
} from "./chart-presentation";
import {
  ZOAM_EXPORT_CURRENCY,
  ZOAM_EXPORT_SOURCE_APPLICATION,
  ZOAM_MINISTRY_ALLOCATION_SCHEMA,
  ZOAM_PRIVACY_FORBIDDEN_KEYS,
  formatUsdFromCents,
  normalizeFunctionName,
  type ZoamMinistryAllocationV1,
  type ZoamMinistryFunctionV1,
} from "./zoam-schema";

export { recalculateInvestmentPercents };

export type ZoamImportIssue = {
  severity: "error" | "warning" | "info";
  message: string;
};

export type ZoamImportPreviewFunction = {
  name: string;
  recordedTimeMinutes: number;
  directExpenseCents: number;
  timeWeightedAllocatedExpenseCents: number;
  /** Original source investment from the PD snapshot (before Mission Share fold-in). */
  sourceInvestmentCents: number;
  /** Display investment after Mission Share is included in Operations. */
  totalInvestmentCents: number;
  missionShareIncludedCents: number;
  /** True when this row was synthesized because the source omitted a zero-allocation function. */
  synthesizedFromCanonical: boolean;
  /** Recalculated from display totals; not the payload percentage. */
  percent: number;
};

export type ZoamImportPreview = {
  reportingMonth: string;
  reportingMonthLabel: string;
  exportedAt: string;
  sourceApplication: string;
  schemaVersion: string;
  functions: ZoamImportPreviewFunction[];
  chartSlices: AllocationSlice[];
  missionShareCents: number;
  missionShareIncludedInReportedFinancialTotal: boolean;
  missionShareFoldedIntoOperations: boolean;
  /** Public chart total including Mission Share in Operations. */
  chartTotalInvestmentCents: number;
  /** Original allocated investment from the snapshot (excludes Mission Share). */
  totalAllocatedInvestmentCents: number;
  reportedMonthlyFinancialTotalCents: number;
  reconciliationStatus: "reconciled";
  calculationWarnings: string[];
  methodology: string;
  chartPublicationBlockedReason: string | null;
};

export type ZoamImportCompare = {
  hasExisting: boolean;
  currentReportingMonth: string | null;
  incomingReportingMonth: string;
  isOlderThanCurrent: boolean;
  isIdenticalDuplicate: boolean;
  wouldReplaceDifferentValues: boolean;
  requiresConfirmation: boolean;
};

export type ZoamImportValid = {
  ok: true;
  snapshot: ZoamMinistryAllocationV1;
  preview: ZoamImportPreview;
  issues: ZoamImportIssue[];
  compare: ZoamImportCompare;
};

export type ZoamImportInvalid = {
  ok: false;
  issues: ZoamImportIssue[];
  preview: null;
  snapshot: null;
  compare: ZoamImportCompare | null;
};

export type ZoamImportResult = ZoamImportValid | ZoamImportInvalid;

export type ZoamExistingAllocationMeta = {
  reportingMonthKey?: string | null;
  reportingMonthLabel?: string | null;
  snapshot?: ZoamMinistryAllocationV1 | null;
};

function err(message: string): ZoamImportIssue {
  return { severity: "error", message };
}

function warn(message: string): ZoamImportIssue {
  return { severity: "warning", message };
}

function info(message: string): ZoamImportIssue {
  return { severity: "info", message };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeSafeInt(n: unknown): n is number {
  return typeof n === "number" && Number.isSafeInteger(n) && n >= 0;
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  const t = Date.parse(value);
  return Number.isFinite(t);
}

function isReportMonth(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value.trim());
}

export function zoamSnapshotContainsForbiddenPrivacyKeys(json: string): string[] {
  const found: string[] = [];
  for (const key of ZOAM_PRIVACY_FORBIDDEN_KEYS) {
    const re = new RegExp(`"${key}"\\s*:`, "i");
    if (re.test(json)) found.push(key);
  }
  return found;
}

function canonicalFinancialFingerprint(snapshot: ZoamMinistryAllocationV1): string {
  return JSON.stringify({
    reportingMonth: snapshot.reportingMonth,
    missionShare: snapshot.missionShare,
    reportedMonthlyFinancialTotalCents: snapshot.reportedMonthlyFinancialTotalCents,
    totalAllocatedInvestmentCents: snapshot.totalAllocatedInvestmentCents,
    ministryFunctions: snapshot.ministryFunctions.map((f) => ({
      name: normalizeFunctionName(f.name),
      recordedTimeMinutes: f.recordedTimeMinutes,
      directExpenseCents: f.directExpenseCents,
      timeWeightedAllocatedExpenseCents: f.timeWeightedAllocatedExpenseCents,
      totalInvestmentCents: f.totalInvestmentCents,
    })),
  });
}

function compareMonths(a: string, b: string): number {
  // YYYY-MM lexicographic compare
  return a.localeCompare(b);
}

function buildCompare(
  snapshot: ZoamMinistryAllocationV1,
  existing: ZoamExistingAllocationMeta | null | undefined,
): ZoamImportCompare {
  const currentKey =
    existing?.snapshot?.reportingMonth?.trim() ||
    existing?.reportingMonthKey?.trim() ||
    null;
  const hasExisting = Boolean(existing?.snapshot || currentKey);
  const isIdenticalDuplicate = Boolean(
    existing?.snapshot &&
      canonicalFinancialFingerprint(existing.snapshot) === canonicalFinancialFingerprint(snapshot),
  );
  const isOlderThanCurrent = Boolean(
    currentKey && compareMonths(snapshot.reportingMonth, currentKey) < 0,
  );
  const wouldReplaceDifferentValues = Boolean(
    existing?.snapshot && !isIdenticalDuplicate,
  );

  return {
    hasExisting,
    currentReportingMonth: currentKey,
    incomingReportingMonth: snapshot.reportingMonth,
    isOlderThanCurrent,
    isIdenticalDuplicate,
    wouldReplaceDifferentValues,
    requiresConfirmation: wouldReplaceDifferentValues || isOlderThanCurrent,
  };
}

function validateFunction(
  raw: unknown,
  index: number,
  issues: ZoamImportIssue[],
): ZoamMinistryFunctionV1 | null {
  if (!isPlainObject(raw)) {
    issues.push(err(`ministryFunctions[${index}] must be an object.`));
    return null;
  }
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) {
    issues.push(err(`ministryFunctions[${index}].name is required.`));
    return null;
  }
  if (!isNonNegativeSafeInt(raw.recordedTimeMinutes)) {
    issues.push(err(`"${name}": recordedTimeMinutes must be a nonnegative integer.`));
    return null;
  }
  if (!isFiniteNumber(raw.recordedTimePercentage) || raw.recordedTimePercentage < 0) {
    issues.push(err(`"${name}": recordedTimePercentage must be a nonnegative number.`));
    return null;
  }
  for (const key of [
    "directExpenseCents",
    "timeWeightedAllocatedExpenseCents",
    "totalInvestmentCents",
  ] as const) {
    if (!isNonNegativeSafeInt(raw[key])) {
      issues.push(err(`"${name}": ${key} must be a nonnegative integer (cents).`));
      return null;
    }
  }
  if (!isFiniteNumber(raw.calculatedInvestmentPercentage) || raw.calculatedInvestmentPercentage < 0) {
    issues.push(err(`"${name}": calculatedInvestmentPercentage must be a nonnegative number.`));
    return null;
  }

  const direct = raw.directExpenseCents as number;
  const allocated = raw.timeWeightedAllocatedExpenseCents as number;
  const total = raw.totalInvestmentCents as number;
  if (direct + allocated !== total) {
    issues.push(
      err(
        `"${name}": totalInvestmentCents (${total}) must equal direct (${direct}) + time-weighted (${allocated}).`,
      ),
    );
    return null;
  }

  return {
    name,
    recordedTimeMinutes: raw.recordedTimeMinutes as number,
    recordedTimePercentage: raw.recordedTimePercentage as number,
    directExpenseCents: direct,
    timeWeightedAllocatedExpenseCents: allocated,
    totalInvestmentCents: total,
    calculatedInvestmentPercentage: raw.calculatedInvestmentPercentage as number,
  };
}

/**
 * Parse and validate pasted JSON. Does not mutate Site Builder state.
 */
export function validateZoamMinistryAllocationImport(
  rawText: string,
  existing?: ZoamExistingAllocationMeta | null,
): ZoamImportResult {
  const issues: ZoamImportIssue[] = [];
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      ok: false,
      issues: [err("Paste a Ministry Allocation JSON snapshot from PD Coaching OS.")],
      preview: null,
      snapshot: null,
      compare: null,
    };
  }

  const forbidden = zoamSnapshotContainsForbiddenPrivacyKeys(trimmed);
  if (forbidden.length > 0) {
    issues.push(
      err(
        `Snapshot contains unsupported or private field(s): ${forbidden.join(", ")}. Remove them before importing.`,
      ),
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      issues: [err("Invalid JSON. Copy the snapshot again from PD Coaching OS."), ...issues],
      preview: null,
      snapshot: null,
      compare: null,
    };
  }

  if (!isPlainObject(parsed)) {
    return {
      ok: false,
      issues: [err("Snapshot must be a JSON object."), ...issues],
      preview: null,
      snapshot: null,
      compare: null,
    };
  }

  if (parsed.schemaVersion !== ZOAM_MINISTRY_ALLOCATION_SCHEMA) {
    issues.push(
      err(
        `Unsupported schemaVersion "${String(parsed.schemaVersion ?? "")}". Expected "${ZOAM_MINISTRY_ALLOCATION_SCHEMA}".`,
      ),
    );
  }
  if (parsed.sourceApplication !== ZOAM_EXPORT_SOURCE_APPLICATION) {
    issues.push(
      err(
        `sourceApplication must be "${ZOAM_EXPORT_SOURCE_APPLICATION}" (received "${String(parsed.sourceApplication ?? "")}").`,
      ),
    );
  }
  if (!isIsoTimestamp(parsed.exportedAt)) {
    issues.push(err("exportedAt must be a valid ISO-8601 timestamp."));
  }
  if (!isReportMonth(parsed.reportingMonth)) {
    issues.push(err("reportingMonth must be YYYY-MM."));
  }
  if (typeof parsed.reportingMonthLabel !== "string" || !parsed.reportingMonthLabel.trim()) {
    issues.push(err("reportingMonthLabel is required."));
  }
  if (typeof parsed.allocationMethodology !== "string" || !parsed.allocationMethodology.trim()) {
    issues.push(err("allocationMethodology is required."));
  }
  if (parsed.currency !== ZOAM_EXPORT_CURRENCY) {
    issues.push(err(`currency must be "${ZOAM_EXPORT_CURRENCY}".`));
  }
  if (
    !isPlainObject(parsed.scope) ||
    parsed.scope.household !== "combined" ||
    parsed.scope.label !== "Combined"
  ) {
    issues.push(err('scope must be { "household": "combined", "label": "Combined" }.'));
  }

  if (!isPlainObject(parsed.missionShare)) {
    issues.push(err("missionShare is required."));
  } else {
    if (!isNonNegativeSafeInt(parsed.missionShare.amountCents)) {
      issues.push(err("missionShare.amountCents must be a nonnegative integer."));
    }
    if (typeof parsed.missionShare.includedInReportedFinancialTotal !== "boolean") {
      issues.push(err("missionShare.includedInReportedFinancialTotal must be a boolean."));
    }
  }

  if (!isNonNegativeSafeInt(parsed.reportedMonthlyFinancialTotalCents)) {
    issues.push(err("reportedMonthlyFinancialTotalCents must be a nonnegative integer."));
  } else if (parsed.reportedMonthlyFinancialTotalCents <= 0) {
    issues.push(err("reportedMonthlyFinancialTotalCents must be greater than zero."));
  }
  if (!isNonNegativeSafeInt(parsed.totalAllocatedInvestmentCents)) {
    issues.push(err("totalAllocatedInvestmentCents must be a nonnegative integer."));
  }

  if (!isPlainObject(parsed.reconciliation)) {
    issues.push(err("reconciliation is required."));
  } else {
    if (parsed.reconciliation.status !== "reconciled") {
      issues.push(err('reconciliation.status must be "reconciled".'));
    }
    if (parsed.reconciliation.shortfallCents !== 0) {
      issues.push(err("reconciliation.shortfallCents must be 0 (no financial shortfall)."));
    }
    if (parsed.reconciliation.unallocatedExpensePoolCents !== 0) {
      issues.push(
        err("reconciliation.unallocatedExpensePoolCents must be 0 (no unexplained unallocated funds)."),
      );
    }
  }

  if (!Array.isArray(parsed.calculationWarnings)) {
    issues.push(err("calculationWarnings must be an array of strings."));
  } else if (!parsed.calculationWarnings.every((w) => typeof w === "string")) {
    issues.push(err("calculationWarnings entries must be strings."));
  }

  if (!Array.isArray(parsed.ministryFunctions)) {
    issues.push(err("ministryFunctions must be an array."));
  }

  // Hard stop on structural errors before deep function validation.
  if (issues.some((i) => i.severity === "error")) {
    return { ok: false, issues, preview: null, snapshot: null, compare: null };
  }

  const functions: ZoamMinistryFunctionV1[] = [];
  const nameSet = new Set<string>();
  for (let i = 0; i < (parsed.ministryFunctions as unknown[]).length; i++) {
    const fn = validateFunction((parsed.ministryFunctions as unknown[])[i], i, issues);
    if (!fn) continue;
    const key = normalizeFunctionName(fn.name);
    if (nameSet.has(key)) {
      issues.push(err(`Duplicate ministry function name "${fn.name}". Names must be unique.`));
    }
    nameSet.add(key);
    functions.push(fn);
  }

  if (functions.length === 0) {
    issues.push(err("ministryFunctions must include at least one function."));
  }

  const meaningful = functions.some(
    (f) =>
      f.recordedTimeMinutes > 0 ||
      f.directExpenseCents > 0 ||
      f.totalInvestmentCents > 0,
  );
  if (functions.length > 0 && !meaningful) {
    issues.push(err("The allocation has no meaningful function-level time or expense data."));
  }

  // Zero-time with direct expenses is allowed (and expected).
  for (const f of functions) {
    if (f.recordedTimeMinutes === 0 && f.directExpenseCents > 0 && f.timeWeightedAllocatedExpenseCents !== 0) {
      issues.push(
        warn(
          `"${f.name}" has zero recorded time but a nonzero time-weighted allocation; verify the export.`,
        ),
      );
    }
  }

  const sumInvestments = functions.reduce((s, f) => s + f.totalInvestmentCents, 0);
  const totalAllocated = parsed.totalAllocatedInvestmentCents as number;
  if (sumInvestments !== totalAllocated) {
    issues.push(
      err(
        `Sum of function totalInvestmentCents (${formatUsdFromCents(sumInvestments)}) must equal totalAllocatedInvestmentCents (${formatUsdFromCents(totalAllocated)}).`,
      ),
    );
  }

  const missionShare = parsed.missionShare as {
    amountCents: number;
    includedInReportedFinancialTotal: boolean;
  };
  const reported = parsed.reportedMonthlyFinancialTotalCents as number;
  const expectedReported = missionShare.includedInReportedFinancialTotal
    ? totalAllocated + missionShare.amountCents
    : totalAllocated;
  if (expectedReported !== reported) {
    issues.push(
      err(
        missionShare.includedInReportedFinancialTotal
          ? `Allocated investment plus Mission Share must equal reportedMonthlyFinancialTotalCents (${formatUsdFromCents(reported)}).`
          : `Allocated investment must equal reportedMonthlyFinancialTotalCents when Mission Share is excluded (${formatUsdFromCents(reported)}).`,
      ),
    );
  }

  if (issues.some((i) => i.severity === "error")) {
    return { ok: false, issues, preview: null, snapshot: null, compare: null };
  }

  const snapshot: ZoamMinistryAllocationV1 = {
    schemaVersion: ZOAM_MINISTRY_ALLOCATION_SCHEMA,
    sourceApplication: ZOAM_EXPORT_SOURCE_APPLICATION,
    exportedAt: String(parsed.exportedAt),
    reportingMonth: String(parsed.reportingMonth).trim(),
    reportingMonthLabel: String(parsed.reportingMonthLabel).trim(),
    allocationMethodology: String(parsed.allocationMethodology).trim(),
    currency: ZOAM_EXPORT_CURRENCY,
    scope: { household: "combined", label: "Combined" },
    ministryFunctions: functions,
    missionShare: {
      amountCents: missionShare.amountCents,
      includedInReportedFinancialTotal: missionShare.includedInReportedFinancialTotal,
    },
    reportedMonthlyFinancialTotalCents: reported,
    totalAllocatedInvestmentCents: totalAllocated,
    reconciliation: {
      status: "reconciled",
      shortfallCents: 0,
      unallocatedExpensePoolCents: 0,
    },
    calculationWarnings: (parsed.calculationWarnings as string[]).map(String),
  };

  // Source percentages vs payload (informational) — public chart uses presentation fold-in.
  const sourceSlices = recalculateInvestmentPercents(
    functions.map((f) => ({
      name: f.name,
      totalInvestmentCents: f.totalInvestmentCents,
    })),
  );
  for (let i = 0; i < functions.length; i++) {
    const supplied = functions[i]!.calculatedInvestmentPercentage;
    const recalc = sourceSlices[i]!.percent;
    if (Math.abs(supplied - recalc) > 0.6) {
      issues.push(
        warn(
          `"${functions[i]!.name}": supplied percentage ${supplied}% differs from recalculated ${recalc}% (recalculated value will be used).`,
        ),
      );
    }
  }

  const presentation = derivePublicChartFromZoamSnapshot(snapshot);
  if (!presentation.ok) {
    // Presentation should always succeed for the canonical seven-function set.
    issues.push(err(presentation.error));
  } else {
    if (presentation.operationsSynthesized) {
      issues.push(
        info(
          `Ministry Operations & Stewardship was omitted from the source (zero allocation). A $0 presentation row was added so Team Expansion Mission Share can be included (${OPERATIONS_STEWARDSHIP_FUNCTION_ID}). The original snapshot is unchanged.`,
        ),
      );
    }
    if (presentation.missionShareFoldedIntoOperations) {
      issues.push(
        info(
          `Team Expansion Mission Share (${formatUsdFromCents(presentation.missionShareCents)}) is included in ${presentation.operationsFunctionName} for the public chart.`,
        ),
      );
    } else if (
      presentation.missionShareAlreadyInSourceTotals &&
      snapshot.missionShare.amountCents > 0
    ) {
      issues.push(
        warn(
          "Mission Share appears already included in function totals; it will not be added again to Ministry Operations & Stewardship.",
        ),
      );
    }
  }

  const compare = buildCompare(snapshot, existing);
  if (compare.isIdenticalDuplicate) {
    issues.push(
      info(
        "This snapshot matches the current allocation. No reimport is needed — chart presentation (including Mission Share in Operations) updates automatically from the saved snapshot.",
      ),
    );
  }
  if (compare.isOlderThanCurrent) {
    issues.push(
      warn(
        `Incoming reporting month ${compare.incomingReportingMonth} is older than the current ${compare.currentReportingMonth}.`,
      ),
    );
  }
  if (compare.wouldReplaceDifferentValues) {
    issues.push(
      warn(
        `This will replace the existing ${compare.currentReportingMonth} allocation with ${compare.incomingReportingMonth}. Confirm before applying.`,
      ),
    );
  }
  for (const w of snapshot.calculationWarnings) {
    issues.push(warn(`PD calculator: ${w}`));
  }

  const hardErrors = issues.filter((i) => i.severity === "error");
  if (hardErrors.length > 0) {
    return { ok: false, issues, preview: null, snapshot: null, compare };
  }

  if (!presentation.ok) {
    return { ok: false, issues, preview: null, snapshot: null, compare };
  }

  const sourceByCanonical = new Map<string, ZoamMinistryFunctionV1>();
  for (const f of functions) {
    const id = resolveCanonicalFunctionId({ name: f.name });
    if (id) sourceByCanonical.set(id, f);
  }

  const preview: ZoamImportPreview = {
    reportingMonth: snapshot.reportingMonth,
    reportingMonthLabel: snapshot.reportingMonthLabel,
    exportedAt: snapshot.exportedAt,
    sourceApplication: snapshot.sourceApplication,
    schemaVersion: snapshot.schemaVersion,
    functions: presentation.functions.map((row) => {
      const source = sourceByCanonical.get(row.canonicalId) ?? null;
      return {
        name: row.name,
        recordedTimeMinutes: source?.recordedTimeMinutes ?? 0,
        directExpenseCents: source?.directExpenseCents ?? 0,
        timeWeightedAllocatedExpenseCents: source?.timeWeightedAllocatedExpenseCents ?? 0,
        sourceInvestmentCents: row.sourceInvestmentCents,
        totalInvestmentCents: row.displayInvestmentCents,
        missionShareIncludedCents: row.missionShareIncludedCents,
        synthesizedFromCanonical: row.synthesizedFromCanonical,
        percent: row.percent,
      };
    }),
    chartSlices: presentation.slices,
    missionShareCents: snapshot.missionShare.amountCents,
    missionShareIncludedInReportedFinancialTotal:
      snapshot.missionShare.includedInReportedFinancialTotal,
    missionShareFoldedIntoOperations: presentation.missionShareFoldedIntoOperations,
    chartTotalInvestmentCents: presentation.chartTotalCents,
    totalAllocatedInvestmentCents: snapshot.totalAllocatedInvestmentCents,
    reportedMonthlyFinancialTotalCents: snapshot.reportedMonthlyFinancialTotalCents,
    reconciliationStatus: "reconciled",
    calculationWarnings: snapshot.calculationWarnings,
    methodology: snapshot.allocationMethodology,
    chartPublicationBlockedReason: null,
  };

  return { ok: true, snapshot, preview, issues, compare };
}

export function parseStoredZoamSnapshot(raw: unknown): ZoamMinistryAllocationV1 | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    const result = validateZoamMinistryAllocationImport(raw);
    return result.ok ? result.snapshot : null;
  }
  if (isPlainObject(raw)) {
    const result = validateZoamMinistryAllocationImport(JSON.stringify(raw));
    return result.ok ? result.snapshot : null;
  }
  return null;
}

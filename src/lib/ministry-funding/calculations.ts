/**
 * Pure calculation helpers for Ministry Funding & Partnership.
 * Missing values are null (awaiting update). Explicit zero is 0.
 */

export type MoneyInput = number | null;

export type FundingGoalInputs = {
  /** Monthly recurring partnership goal. null = not yet set. */
  monthlyGoal: MoneyInput;
  /** Current monthly recurring partnership. null = not yet set. */
  monthlyRecurring: MoneyInput;
};

export type FundingGoalDerived = {
  monthlyGoal: MoneyInput;
  monthlyRecurring: MoneyInput;
  annualGoal: MoneyInput;
  annualizedRecurring: MoneyInput;
  remainingMonthly: MoneyInput;
  remainingAnnual: MoneyInput;
  /**
   * Actual funding progress percentage when both inputs are set and goal > 0.
   * May exceed 100 when partnership surpasses the goal. Null when incomplete
   * or when the monthly goal is zero (avoids divide-by-zero).
   */
  percentAchieved: number | null;
  /** Visual progress bar width 0–100. Caps over-goal progress at 100. */
  progressBarPercent: number | null;
  /** True when both primary inputs are present (including explicit zeros). */
  isComplete: boolean;
};

export type FunctionAllocationInput = {
  id: string;
  name: string;
  /** Allocated expense amount for the reporting period. null = not entered. */
  amount: MoneyInput;
};

export type AllocationDatasetInput = {
  functions: FunctionAllocationInput[];
  /** Team Expansion Mission Share — tracked separately from the seven functions. */
  missionShareAmount: MoneyInput;
  /**
   * When true, expenseTotal must equal sum(functions) + missionShare.
   * When false, expenseTotal must equal sum(functions); Mission Share is reported outside that total.
   */
  missionShareIncludedInExpenseTotal: boolean;
  /** Admin-entered expense total the allocation must reconcile to. null = not set. */
  expenseTotal: MoneyInput;
  reportingMonth: string;
};

export type AllocationSlice = {
  id: string;
  name: string;
  amount: number;
  percent: number;
};

export type AllocationDerived = {
  reportingMonth: string;
  /** True when every function has an entered amount (including 0). */
  hasCompleteFunctionAmounts: boolean;
  functionTotal: number | null;
  missionShareAmount: MoneyInput;
  missionShareIncludedInExpenseTotal: boolean;
  expenseTotal: MoneyInput;
  slices: AllocationSlice[];
  /** Chart may publish only when complete, reconciled, and at least one positive amount. */
  canPublishChart: boolean;
  reconciliationOk: boolean;
  reconciliationExpected: number | null;
  reconciliationActual: number | null;
  discrepancy: number | null;
};

/** Parse a Site Builder money field. Empty / whitespace → null. Invalid → null. */
export function parseMoneyInput(raw: unknown): MoneyInput {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0) return null;
    return raw;
  }
  // Strip rich-text markup if a value was previously saved through a text editor.
  const text = String(raw)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  if (!text) return null;
  const cleaned = text.replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/**
 * Normalize a money field for Site Builder storage.
 * Empty → ""; keeps valid non-negative numeric typing (including "0" and "10.").
 * Rejects negatives and non-numeric input (falls back to parsed value when pasting currency).
 */
export function normalizeMoneyFieldInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const cleaned = trimmed.replace(/[$,]/g, "").replace(/\s/g, "");
  if (!cleaned) return "";
  if (/^\d*\.?\d*$/.test(cleaned)) {
    if (cleaned === ".") return "";
    return cleaned;
  }
  const parsed = parseMoneyInput(raw);
  return parsed === null ? "" : String(parsed);
}

export function annualizeMonthly(monthly: MoneyInput): MoneyInput {
  if (monthly === null) return null;
  return monthly * 12;
}

export function deriveFundingGoals(input: FundingGoalInputs): FundingGoalDerived {
  const monthlyGoal = input.monthlyGoal !== null && input.monthlyGoal < 0 ? null : input.monthlyGoal;
  const monthlyRecurring =
    input.monthlyRecurring !== null && input.monthlyRecurring < 0 ? null : input.monthlyRecurring;

  const annualGoal = annualizeMonthly(monthlyGoal);
  const annualizedRecurring = annualizeMonthly(monthlyRecurring);

  const isComplete = monthlyGoal !== null && monthlyRecurring !== null;

  const remainingMonthly =
    isComplete && monthlyGoal !== null && monthlyRecurring !== null
      ? Math.max(0, monthlyGoal - monthlyRecurring)
      : null;
  const remainingAnnual =
    isComplete && annualGoal !== null && annualizedRecurring !== null
      ? Math.max(0, annualGoal - annualizedRecurring)
      : null;

  let percentAchieved: number | null = null;
  let progressBarPercent: number | null = null;
  if (isComplete && monthlyGoal !== null && monthlyRecurring !== null) {
    if (monthlyGoal === 0) {
      // Avoid divide-by-zero: no meaningful percentage against a $0 goal.
      percentAchieved = null;
      progressBarPercent = monthlyRecurring > 0 ? 100 : 0;
    } else {
      percentAchieved = Math.round((monthlyRecurring / monthlyGoal) * 100);
      progressBarPercent = Math.min(100, percentAchieved);
    }
  }

  return {
    monthlyGoal,
    monthlyRecurring,
    annualGoal,
    annualizedRecurring,
    remainingMonthly,
    remainingAnnual,
    percentAchieved,
    progressBarPercent,
    isComplete,
  };
}

function sumAmounts(amounts: MoneyInput[]): number | null {
  if (amounts.some((a) => a === null)) return null;
  return amounts.reduce<number>((sum, a) => sum + (a ?? 0), 0);
}

export function deriveAllocation(input: AllocationDatasetInput): AllocationDerived {
  const amounts = input.functions.map((f) => f.amount);
  const hasCompleteFunctionAmounts = amounts.every((a) => a !== null);
  const functionTotal = sumAmounts(amounts);

  const slices: AllocationSlice[] =
    hasCompleteFunctionAmounts && functionTotal !== null && functionTotal > 0
      ? input.functions.map((f) => {
          const amount = f.amount ?? 0;
          return {
            id: f.id,
            name: f.name,
            amount,
            percent: Math.round((amount / functionTotal) * 1000) / 10,
          };
        })
      : hasCompleteFunctionAmounts && functionTotal === 0
        ? input.functions.map((f) => ({
            id: f.id,
            name: f.name,
            amount: 0,
            percent: 0,
          }))
        : [];

  // Normalize rounding so slices sum to 100 when there is positive total.
  if (slices.length > 0 && functionTotal !== null && functionTotal > 0) {
    const rawSum = slices.reduce((s, x) => s + x.percent, 0);
    const drift = Math.round((100 - rawSum) * 10) / 10;
    if (drift !== 0) {
      const largest = slices.reduce((best, s, i) => (s.amount > slices[best]!.amount ? i : best), 0);
      slices[largest] = {
        ...slices[largest]!,
        percent: Math.round((slices[largest]!.percent + drift) * 10) / 10,
      };
    }
  }

  const reconciliationExpected = input.expenseTotal;
  let reconciliationActual: number | null = functionTotal;
  if (functionTotal !== null && input.missionShareIncludedInExpenseTotal) {
    reconciliationActual =
      input.missionShareAmount === null ? null : functionTotal + input.missionShareAmount;
  }

  const reconciliationOk =
    reconciliationExpected !== null &&
    reconciliationActual !== null &&
    Math.abs(reconciliationExpected - reconciliationActual) < 0.01;

  const discrepancy =
    reconciliationExpected !== null && reconciliationActual !== null
      ? Math.round((reconciliationActual - reconciliationExpected) * 100) / 100
      : null;

  const canPublishChart =
    hasCompleteFunctionAmounts &&
    functionTotal !== null &&
    functionTotal > 0 &&
    reconciliationOk &&
    slices.some((s) => s.amount > 0);

  return {
    reportingMonth: input.reportingMonth,
    hasCompleteFunctionAmounts,
    functionTotal,
    missionShareAmount: input.missionShareAmount,
    missionShareIncludedInExpenseTotal: input.missionShareIncludedInExpenseTotal,
    expenseTotal: input.expenseTotal,
    slices,
    canPublishChart,
    reconciliationOk,
    reconciliationExpected,
    reconciliationActual,
    discrepancy,
  };
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

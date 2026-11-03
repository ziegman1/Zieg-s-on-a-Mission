import { describe, expect, it } from "vitest";
import {
  deriveAllocation,
  deriveFundingGoals,
  formatUsd,
  normalizeMoneyFieldInput,
  parseMoneyInput,
} from "./calculations";

describe("parseMoneyInput", () => {
  it("treats empty as missing (null), not zero", () => {
    expect(parseMoneyInput("")).toBeNull();
    expect(parseMoneyInput("   ")).toBeNull();
    expect(parseMoneyInput(null)).toBeNull();
    expect(parseMoneyInput(undefined)).toBeNull();
  });

  it("parses explicit zero and currency-formatted values", () => {
    expect(parseMoneyInput("0")).toBe(0);
    expect(parseMoneyInput(0)).toBe(0);
    expect(parseMoneyInput("$1,250.00")).toBe(1250);
  });

  it("strips rich-text markup from previously mis-saved amounts", () => {
    expect(parseMoneyInput("<p>2500</p>")).toBe(2500);
    expect(parseMoneyInput("<p>$1,000</p>")).toBe(1000);
  });

  it("rejects negatives and non-numeric text", () => {
    expect(parseMoneyInput("-10")).toBeNull();
    expect(parseMoneyInput(-5)).toBeNull();
    expect(parseMoneyInput("abc")).toBeNull();
  });
});

describe("normalizeMoneyFieldInput", () => {
  it("keeps blank distinct from zero", () => {
    expect(normalizeMoneyFieldInput("")).toBe("");
    expect(normalizeMoneyFieldInput("0")).toBe("0");
  });

  it("accepts positive amounts and rejects negatives", () => {
    expect(normalizeMoneyFieldInput("1250")).toBe("1250");
    expect(normalizeMoneyFieldInput("$1,250")).toBe("1250");
    expect(normalizeMoneyFieldInput("-5")).toBe("");
  });
});

describe("deriveFundingGoals", () => {
  it("awaits update when either primary input is missing", () => {
    const partial = deriveFundingGoals({ monthlyGoal: 10000, monthlyRecurring: null });
    expect(partial.isComplete).toBe(false);
    expect(partial.percentAchieved).toBeNull();
    expect(partial.progressBarPercent).toBeNull();
    expect(partial.annualGoal).toBe(120000);
    expect(partial.remainingMonthly).toBeNull();
  });

  it("derives annualized values and remaining need from monthly inputs", () => {
    const full = deriveFundingGoals({ monthlyGoal: 10000, monthlyRecurring: 4000 });
    expect(full.isComplete).toBe(true);
    expect(full.annualGoal).toBe(120000);
    expect(full.annualizedRecurring).toBe(48000);
    expect(full.remainingMonthly).toBe(6000);
    expect(full.remainingAnnual).toBe(72000);
    expect(full.percentAchieved).toBe(40);
    expect(full.progressBarPercent).toBe(40);
  });

  it("matches the compact three-card presentation example ($8,000 / $4,360)", () => {
    const full = deriveFundingGoals({ monthlyGoal: 8000, monthlyRecurring: 4360 });
    expect(full.remainingMonthly).toBe(3640);
    expect(full.annualGoal).toBe(96000);
    expect(full.remainingAnnual).toBe(43680);
    expect(full.percentAchieved).toBe(55);
    expect(full.progressBarPercent).toBe(55);
    expect(formatUsd(full.monthlyGoal!)).toBe("$8,000");
    expect(formatUsd(full.monthlyRecurring!)).toBe("$4,360");
    expect(formatUsd(full.remainingMonthly!)).toBe("$3,640");
  });

  it("treats explicit zero recurring as complete data", () => {
    const zero = deriveFundingGoals({ monthlyGoal: 5000, monthlyRecurring: 0 });
    expect(zero.isComplete).toBe(true);
    expect(zero.percentAchieved).toBe(0);
    expect(zero.progressBarPercent).toBe(0);
    expect(zero.remainingMonthly).toBe(5000);
  });

  it("shows actual over-goal percentage but caps the progress bar at 100", () => {
    const over = deriveFundingGoals({ monthlyGoal: 1000, monthlyRecurring: 1500 });
    expect(over.remainingMonthly).toBe(0);
    expect(over.percentAchieved).toBe(150);
    expect(over.progressBarPercent).toBe(100);
  });

  it("avoids divide-by-zero when the monthly goal is zero", () => {
    const zeroGoal = deriveFundingGoals({ monthlyGoal: 0, monthlyRecurring: 100 });
    expect(zeroGoal.isComplete).toBe(true);
    expect(zeroGoal.percentAchieved).toBeNull();
    expect(zeroGoal.progressBarPercent).toBe(100);
  });
});

describe("deriveAllocation", () => {
  const functions = [
    { id: "a", name: "A", amount: 300 },
    { id: "b", name: "B", amount: 700 },
  ];

  it("blocks chart when amounts are incomplete", () => {
    const result = deriveAllocation({
      functions: [
        { id: "a", name: "A", amount: 100 },
        { id: "b", name: "B", amount: null },
      ],
      missionShareAmount: 50,
      missionShareIncludedInExpenseTotal: true,
      expenseTotal: 150,
      reportingMonth: "2026-01",
    });
    expect(result.canPublishChart).toBe(false);
    expect(result.slices).toEqual([]);
  });

  it("calculates percentages from amounts and reconciles with Mission Share included", () => {
    const result = deriveAllocation({
      functions,
      missionShareAmount: 200,
      missionShareIncludedInExpenseTotal: true,
      expenseTotal: 1200,
      reportingMonth: "March 2026",
    });
    expect(result.reconciliationOk).toBe(true);
    expect(result.canPublishChart).toBe(true);
    expect(result.slices.map((s) => s.percent)).toEqual([30, 70]);
  });

  it("blocks chart when totals do not reconcile", () => {
    const result = deriveAllocation({
      functions,
      missionShareAmount: 200,
      missionShareIncludedInExpenseTotal: true,
      expenseTotal: 999,
      reportingMonth: "March 2026",
    });
    expect(result.reconciliationOk).toBe(false);
    expect(result.canPublishChart).toBe(false);
    expect(result.discrepancy).toBe(201);
  });

  it("keeps Mission Share outside function percentages when excluded from expense total", () => {
    const result = deriveAllocation({
      functions,
      missionShareAmount: 500,
      missionShareIncludedInExpenseTotal: false,
      expenseTotal: 1000,
      reportingMonth: "March 2026",
    });
    expect(result.reconciliationOk).toBe(true);
    expect(result.canPublishChart).toBe(true);
    expect(result.slices.every((s) => s.id !== "mission-share")).toBe(true);
    expect(result.missionShareAmount).toBe(500);
  });
});

describe("formatUsd", () => {
  it("formats whole dollars", () => {
    expect(formatUsd(1250)).toBe("$1,250");
  });
});

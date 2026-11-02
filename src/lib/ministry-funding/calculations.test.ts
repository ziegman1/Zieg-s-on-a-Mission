import { describe, expect, it } from "vitest";
import {
  deriveAllocation,
  deriveFundingGoals,
  formatUsd,
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

  it("rejects negatives and non-numeric text", () => {
    expect(parseMoneyInput("-10")).toBeNull();
    expect(parseMoneyInput(-5)).toBeNull();
    expect(parseMoneyInput("abc")).toBeNull();
  });
});

describe("deriveFundingGoals", () => {
  it("awaits update when either primary input is missing", () => {
    const partial = deriveFundingGoals({ monthlyGoal: 10000, monthlyRecurring: null });
    expect(partial.isComplete).toBe(false);
    expect(partial.percentAchieved).toBeNull();
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
  });

  it("treats explicit zero recurring as complete data", () => {
    const zero = deriveFundingGoals({ monthlyGoal: 5000, monthlyRecurring: 0 });
    expect(zero.isComplete).toBe(true);
    expect(zero.percentAchieved).toBe(0);
    expect(zero.remainingMonthly).toBe(5000);
  });

  it("does not produce negative remaining need", () => {
    const over = deriveFundingGoals({ monthlyGoal: 1000, monthlyRecurring: 1500 });
    expect(over.remainingMonthly).toBe(0);
    expect(over.percentAchieved).toBe(100);
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

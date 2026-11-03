/**
 * Parse Site Builder section content into typed funding / allocation inputs.
 */

import type { PageSection } from "@/lib/site-builder/types";
import {
  isMinistryFundingAllocationSection,
  isMinistryFundingGoalsSection,
} from "@/lib/site-builder/ministry-funding-page-sections";
import { contentStr, sortedListItems, visibleListItems } from "@/lib/site-builder/content-utils";
import {
  deriveAllocation,
  deriveFundingGoals,
  parseMoneyInput,
  type AllocationDerived,
  type FundingGoalDerived,
  type FunctionAllocationInput,
} from "./calculations";
import { MISSION_SHARE_CATEGORY } from "@/data/ministry-funding-content";
import { parseStoredZoamSnapshot } from "./zoam-import";
import { centsToDollars, normalizeFunctionName, type ZoamMinistryAllocationV1 } from "./zoam-schema";
import {
  derivePublicChartFromManualFunctions,
  derivePublicChartFromZoamSnapshot,
  type ChartPresentationResult,
} from "./chart-presentation";

export type FundingGoalsView = {
  headline: string;
  awaitingCopy: string;
  figuresUpdatedAt: string;
  derived: FundingGoalDerived;
};

export type FunctionCardView = {
  id: string;
  name: string;
  description: string;
  programs: string[];
  color: string;
  amount: ReturnType<typeof parseMoneyInput>;
  visible: boolean;
  /** True when this card is part of the imported chart set. */
  inChart: boolean;
};

export type AllocationView = {
  headline: string;
  explanation: string;
  distinction: string;
  awaitingCopy: string;
  reportingMonth: string;
  reportingMonthKey: string;
  missionShareLabel: string;
  missionShareDescription: string;
  functions: FunctionCardView[];
  /** Narrative cards (including those without chart amounts). */
  descriptionFunctions: FunctionCardView[];
  derived: AllocationDerived;
  /** Public chart presentation (Mission Share folded into Operations). */
  chartPresentation: ChartPresentationResult | null;
  zoamSnapshot: ZoamMinistryAllocationV1 | null;
  zoamExportedAt: string;
  zoamSchemaVersion: string;
};

function parseBoolString(raw: unknown, fallback: boolean): boolean {
  if (typeof raw === "boolean") return raw;
  const text = String(raw ?? "").trim().toLowerCase();
  if (!text) return fallback;
  if (["true", "1", "yes", "included"].includes(text)) return true;
  if (["false", "0", "no", "excluded"].includes(text)) return false;
  return fallback;
}

export function parseFundingGoalsSection(section: PageSection | undefined): FundingGoalsView | null {
  if (!section) return null;
  const c = section.content;
  return {
    headline: contentStr(c, "headline") || "Our Financial Partnership Goal",
    awaitingCopy: contentStr(c, "body"),
    figuresUpdatedAt: contentStr(c, "figuresUpdatedAt"),
    derived: deriveFundingGoals({
      monthlyGoal: parseMoneyInput(c.monthlyGoal),
      monthlyRecurring: parseMoneyInput(c.monthlyRecurring),
    }),
  };
}

export function parseAllocationSection(
  section: PageSection | undefined,
  opts?: { includeHidden?: boolean },
): AllocationView | null {
  if (!section) return null;
  const c = section.content;
  const cards = opts?.includeHidden
    ? sortedListItems(c.cards, { includeHidden: true })
    : visibleListItems(c.cards);

  const zoamSnapshot = parseStoredZoamSnapshot(c.zoamSnapshot);
  const chartNameSet = new Set(
    (zoamSnapshot?.ministryFunctions ?? []).map((f) => normalizeFunctionName(f.name)),
  );

  const functions: FunctionCardView[] = cards.map((card, i) => {
    const meta = card.metadata ?? {};
    const programsRaw = String(meta.programs ?? "");
    const programs = programsRaw
      .split("\n")
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
    const name = card.text.trim() || `Function ${i + 1}`;
    return {
      id: card.id || `fn-${i}`,
      name,
      description: String(meta.body ?? ""),
      programs,
      color: String(meta.color ?? "#83b0da"),
      amount: parseMoneyInput(meta.amount),
      visible: card.visible,
      inChart: zoamSnapshot
        ? chartNameSet.has(normalizeFunctionName(name))
        : parseMoneyInput(meta.amount) !== null,
    };
  });

  let allocationInputs: FunctionAllocationInput[];
  let missionShareIncluded: boolean;
  let missionShareAmount: ReturnType<typeof parseMoneyInput>;
  let expenseTotal: ReturnType<typeof parseMoneyInput>;
  let derived: AllocationDerived;
  let chartPresentation: ChartPresentationResult | null = null;

  if (zoamSnapshot) {
    // Source reconciliation stays on the original snapshot (Mission Share separate).
    allocationInputs = zoamSnapshot.ministryFunctions.map((f, i) => ({
      id: `fn-${i}`,
      name: f.name,
      amount: centsToDollars(f.totalInvestmentCents),
    }));
    missionShareIncluded = zoamSnapshot.missionShare.includedInReportedFinancialTotal;
    missionShareAmount = centsToDollars(zoamSnapshot.missionShare.amountCents);
    expenseTotal = centsToDollars(zoamSnapshot.reportedMonthlyFinancialTotalCents);
    derived = deriveAllocation({
      functions: allocationInputs,
      missionShareAmount,
      missionShareIncludedInExpenseTotal: missionShareIncluded,
      expenseTotal,
      reportingMonth: zoamSnapshot.reportingMonthLabel || zoamSnapshot.reportingMonth,
    });

    chartPresentation = derivePublicChartFromZoamSnapshot(zoamSnapshot);
    derived = {
      ...derived,
      // Public slices fold Mission Share into Operations (7 functions).
      slices: chartPresentation.ok ? chartPresentation.slices : [],
      canPublishChart:
        derived.reconciliationOk &&
        chartPresentation.ok &&
        chartPresentation.slices.some((s) => s.amount > 0),
    };
  } else {
    const withAmounts = functions.filter((fn) => fn.amount !== null);
    const chartFunctions =
      withAmounts.length > 0 && withAmounts.length < functions.length ? withAmounts : functions;

    missionShareIncluded = parseBoolString(c.missionShareIncludedInExpenseTotal, true);
    missionShareAmount = parseMoneyInput(c.missionShareAmount);
    expenseTotal = parseMoneyInput(c.expenseTotal);
    derived = deriveAllocation({
      functions: chartFunctions.map((fn) => ({
        id: fn.id,
        name: fn.name,
        amount: fn.amount,
      })),
      missionShareAmount,
      missionShareIncludedInExpenseTotal: missionShareIncluded,
      expenseTotal,
      reportingMonth: contentStr(c, "reportingMonth"),
    });

    if (derived.hasCompleteFunctionAmounts && missionShareAmount !== null) {
      chartPresentation = derivePublicChartFromManualFunctions({
        functions: chartFunctions.map((fn) => ({
          id: fn.id,
          name: fn.name,
          amountCents: Math.round((fn.amount ?? 0) * 100),
        })),
        missionShareCents: Math.round(missionShareAmount * 100),
      });
      derived = {
        ...derived,
        slices: chartPresentation.ok ? chartPresentation.slices : [],
        canPublishChart:
          derived.reconciliationOk &&
          chartPresentation.ok &&
          chartPresentation.slices.some((s) => s.amount > 0),
      };
    }
  }

  const descriptionFunctions =
    functions.filter((f) => f.description.trim() || f.programs.length > 0 || f.inChart).length > 0
      ? functions.filter(
          (f) => f.description.trim() || f.programs.length > 0 || !zoamSnapshot || f.inChart,
        )
      : functions;

  return {
    headline: contentStr(c, "headline") || "Estimated Ministry Investment by Function",
    explanation: contentStr(c, "intro"),
    distinction: contentStr(c, "body"),
    awaitingCopy: contentStr(c, "awaitingCopy"),
    reportingMonth:
      zoamSnapshot?.reportingMonthLabel ||
      contentStr(c, "reportingMonth") ||
      zoamSnapshot?.reportingMonth ||
      "",
    reportingMonthKey:
      zoamSnapshot?.reportingMonth || contentStr(c, "reportingMonthKey") || "",
    missionShareLabel: contentStr(c, "missionShareLabel") || MISSION_SHARE_CATEGORY.name,
    missionShareDescription:
      contentStr(c, "missionShareDescription") || MISSION_SHARE_CATEGORY.description,
    functions,
    descriptionFunctions,
    derived,
    chartPresentation,
    zoamSnapshot,
    zoamExportedAt: contentStr(c, "zoamExportedAt") || zoamSnapshot?.exportedAt || "",
    zoamSchemaVersion: contentStr(c, "zoamSchemaVersion") || zoamSnapshot?.schemaVersion || "",
  };
}

export function findFundingGoalsSection(sections: PageSection[]): PageSection | undefined {
  return sections.find(isMinistryFundingGoalsSection);
}

export function findAllocationSection(sections: PageSection[]): PageSection | undefined {
  return sections.find(isMinistryFundingAllocationSection);
}

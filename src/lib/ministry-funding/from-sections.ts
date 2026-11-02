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
};

export type AllocationView = {
  headline: string;
  explanation: string;
  distinction: string;
  awaitingCopy: string;
  reportingMonth: string;
  missionShareLabel: string;
  missionShareDescription: string;
  functions: FunctionCardView[];
  derived: AllocationDerived;
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

  const functions: FunctionCardView[] = cards.map((card, i) => {
    const meta = card.metadata ?? {};
    const programsRaw = String(meta.programs ?? "");
    const programs = programsRaw
      .split("\n")
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
    return {
      id: card.id || `fn-${i}`,
      name: card.text.trim() || `Function ${i + 1}`,
      description: String(meta.body ?? ""),
      programs,
      color: String(meta.color ?? "#83b0da"),
      amount: parseMoneyInput(meta.amount),
      visible: card.visible,
    };
  });

  const allocationInputs: FunctionAllocationInput[] = functions.map((fn) => ({
    id: fn.id,
    name: fn.name,
    amount: fn.amount,
  }));

  const missionShareIncluded = parseBoolString(c.missionShareIncludedInExpenseTotal, true);

  return {
    headline: contentStr(c, "headline") || "Estimated Ministry Investment by Function",
    explanation: contentStr(c, "intro"),
    distinction: contentStr(c, "body"),
    awaitingCopy: contentStr(c, "awaitingCopy"),
    reportingMonth: contentStr(c, "reportingMonth"),
    missionShareLabel: contentStr(c, "missionShareLabel") || MISSION_SHARE_CATEGORY.name,
    missionShareDescription:
      contentStr(c, "missionShareDescription") || MISSION_SHARE_CATEGORY.description,
    functions,
    derived: deriveAllocation({
      functions: allocationInputs,
      missionShareAmount: parseMoneyInput(c.missionShareAmount),
      missionShareIncludedInExpenseTotal: missionShareIncluded,
      expenseTotal: parseMoneyInput(c.expenseTotal),
      reportingMonth: contentStr(c, "reportingMonth"),
    }),
  };
}

export function findFundingGoalsSection(sections: PageSection[]): PageSection | undefined {
  return sections.find(isMinistryFundingGoalsSection);
}

export function findAllocationSection(sections: PageSection[]): PageSection | undefined {
  return sections.find(isMinistryFundingAllocationSection);
}

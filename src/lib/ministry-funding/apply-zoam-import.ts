/**
 * Apply a validated ZOAM ministry allocation snapshot to the Site Builder
 * allocation section draft — without touching Financial Partnership Goal fields.
 */

import type { ListItem, PageSection } from "@/lib/site-builder/types";
import { sortedListItems } from "@/lib/site-builder/content-utils";
import { MINISTRY_FUNDING_FUNCTIONS } from "@/data/ministry-funding-content";
import {
  centsToDollars,
  normalizeFunctionName,
  type ZoamMinistryAllocationV1,
} from "./zoam-schema";

const DEFAULT_COLORS = MINISTRY_FUNDING_FUNCTIONS.map((f) => f.defaultColor);
const FALLBACK_COLORS = ["#83b0da", "#edb73e", "#1e3644", "#5a8fbf", "#c4922e", "#4a6b82", "#8a9eae", "#6b7280"];

function colorForIndex(i: number): string {
  return DEFAULT_COLORS[i] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] ?? "#83b0da";
}

function moneyStringFromCents(cents: number): string {
  const dollars = centsToDollars(cents);
  // Avoid float artifacts for whole dollars; keep two decimals when needed.
  if (Number.isInteger(dollars)) return String(dollars);
  return dollars.toFixed(2);
}

/**
 * Merge imported function amounts into existing cards, preserving descriptions,
 * programs, colors, and visibility. Appends cards for unmatched import names.
 * Unmatched existing cards keep their editorial copy with cleared amounts so the
 * imported snapshot remains the chart authority.
 */
export function applyZoamSnapshotToAllocationSection(
  section: PageSection,
  snapshot: ZoamMinistryAllocationV1,
  opts?: { confirmedReplace?: boolean },
): PageSection {
  void opts;
  const existingCards = sortedListItems(section.content.cards, { includeHidden: true });
  const used = new Set<string>();

  const nextCards: ListItem[] = snapshot.ministryFunctions.map((fn, i) => {
    const key = normalizeFunctionName(fn.name);
    const match = existingCards.find(
      (c) => !used.has(c.id) && normalizeFunctionName(c.text) === key,
    );
    if (match) used.add(match.id);
    const meta = match?.metadata ?? {};
    return {
      id: match?.id ?? `import-${key.replace(/[^a-z0-9]+/g, "-")}-${i}`,
      text: fn.name,
      visible: match?.visible ?? true,
      sortOrder: i,
      metadata: {
        body: String(meta.body ?? ""),
        programs: String(meta.programs ?? ""),
        color: String(meta.color ?? colorForIndex(i)),
        amount: moneyStringFromCents(fn.totalInvestmentCents),
        recordedTimeMinutes: fn.recordedTimeMinutes,
        directExpenseCents: fn.directExpenseCents,
        timeWeightedAllocatedExpenseCents: fn.timeWeightedAllocatedExpenseCents,
        totalInvestmentCents: fn.totalInvestmentCents,
      },
      style: match?.style,
    };
  });

  // Preserve unmatched editorial cards (descriptions) after chart functions, amounts cleared.
  let sort = nextCards.length;
  for (const card of existingCards) {
    if (used.has(card.id)) continue;
    nextCards.push({
      ...card,
      sortOrder: sort++,
      metadata: {
        ...(card.metadata ?? {}),
        amount: "",
      },
    });
  }

  const previousSnapshot = section.content.zoamSnapshot;
  const history = Array.isArray(section.content.zoamSnapshotHistory)
    ? [...(section.content.zoamSnapshotHistory as unknown[])]
    : [];
  if (previousSnapshot && typeof previousSnapshot === "object") {
    history.unshift(previousSnapshot);
  }
  // Cap retained history
  const cappedHistory = history.slice(0, 12);

  return {
    ...section,
    content: {
      ...section.content,
      reportingMonth: snapshot.reportingMonthLabel,
      reportingMonthKey: snapshot.reportingMonth,
      expenseTotal: moneyStringFromCents(snapshot.reportedMonthlyFinancialTotalCents),
      missionShareAmount: moneyStringFromCents(snapshot.missionShare.amountCents),
      missionShareIncludedInExpenseTotal: snapshot.missionShare.includedInReportedFinancialTotal
        ? "true"
        : "false",
      zoamSnapshot: snapshot,
      zoamSnapshotHistory: cappedHistory,
      zoamExportedAt: snapshot.exportedAt,
      zoamSchemaVersion: snapshot.schemaVersion,
      zoamSourceApplication: snapshot.sourceApplication,
      zoamReconciliationStatus: snapshot.reconciliation.status,
      cards: nextCards,
    },
  };
}

export function readZoamExistingMeta(section: PageSection | null | undefined): {
  reportingMonthKey: string | null;
  reportingMonthLabel: string | null;
  snapshot: ZoamMinistryAllocationV1 | null;
} {
  if (!section) {
    return { reportingMonthKey: null, reportingMonthLabel: null, snapshot: null };
  }
  const c = section.content;
  const snap = c.zoamSnapshot;
  const snapshot =
    snap && typeof snap === "object" ? (snap as ZoamMinistryAllocationV1) : null;
  return {
    reportingMonthKey:
      (typeof c.reportingMonthKey === "string" && c.reportingMonthKey) ||
      snapshot?.reportingMonth ||
      null,
    reportingMonthLabel:
      (typeof c.reportingMonth === "string" && c.reportingMonth) ||
      snapshot?.reportingMonthLabel ||
      null,
    snapshot,
  };
}

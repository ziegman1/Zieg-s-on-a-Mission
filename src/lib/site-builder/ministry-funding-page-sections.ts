/**
 * Ministry Funding & Partnership Site Builder sections.
 * Financial inputs and allocation amounts start empty — no fabricated progress.
 */

import { isLegacyGivingHref } from "@/data/giving";
import {
  MINISTRY_FUNDING_CHART,
  MINISTRY_FUNDING_CHART_DISTINCTION_LEGACY,
  MINISTRY_FUNDING_CHART_EXPLANATION_LEGACY,
  MINISTRY_FUNDING_FUNCTIONS,
  MINISTRY_FUNDING_FUNCTIONS_HEADING,
  MINISTRY_FUNDING_FUNCTIONS_INTRO,
  MINISTRY_FUNDING_GOALS,
  MINISTRY_FUNDING_HERO,
  MINISTRY_FUNDING_INVITATION,
  MINISTRY_FUNDING_INVITATION_BODY_LEGACY,
  MISSION_SHARE_CATEGORY,
} from "@/data/ministry-funding-content";
import type { PageSection, SectionType } from "./types";
import { registryFor } from "./registry";

export const MINISTRY_FUNDING_PAGE_KEY = "ministry-funding" as const;

export const MINISTRY_FUNDING_GOALS_SETTING = "ministryFundingGoals";
export const MINISTRY_FUNDING_ALLOCATION_SETTING = "ministryFundingAllocation";

function sec(
  sectionKey: string,
  sectionType: SectionType,
  label: string,
  content: Record<string, unknown>,
  settings: Record<string, unknown> = {},
): PageSection {
  const reg = registryFor(sectionType);
  return {
    id: sectionKey,
    pageKey: MINISTRY_FUNDING_PAGE_KEY,
    sectionKey,
    sectionType,
    label,
    visible: true,
    sortOrder: 0,
    content: { ...reg.defaultContent, ...content },
    settings: { ...reg.defaultSettings, ...settings },
  };
}

function functionCards() {
  return MINISTRY_FUNDING_FUNCTIONS.map((fn, i) => ({
    id: fn.id,
    text: fn.name,
    visible: true,
    sortOrder: i,
    metadata: {
      body: fn.description,
      programs: fn.programs.map((p) => p.name).join("\n"),
      color: fn.defaultColor,
      /** Empty string = amount not entered (missing). Use "0" for explicit zero. */
      amount: "",
    },
  }));
}

export function isMinistryFundingGoalsSection(section: PageSection): boolean {
  return (
    section.settings?.[MINISTRY_FUNDING_GOALS_SETTING] === true ||
    section.sectionKey === "funding-goals"
  );
}

export function isMinistryFundingAllocationSection(section: PageSection): boolean {
  return (
    section.settings?.[MINISTRY_FUNDING_ALLOCATION_SETTING] === true ||
    section.sectionKey === "allocation"
  );
}

export function defaultMinistryFundingSections(): PageSection[] {
  return [
    sec("hero", "hero", "Hero", {
      headline: MINISTRY_FUNDING_HERO.title,
      subheadline: MINISTRY_FUNDING_HERO.supporting,
      body: MINISTRY_FUNDING_HERO.body,
      primaryCtaLabel: "",
      secondaryCtaLabel: "",
      tertiaryCtaLabel: "",
    }),
    sec(
      "funding-goals",
      "text_section",
      "Financial partnership goal",
      {
        headline: MINISTRY_FUNDING_GOALS.title,
        body: MINISTRY_FUNDING_GOALS.awaitingCopy,
        /** Primary inputs — leave empty until verified figures are published. */
        monthlyGoal: "",
        monthlyRecurring: "",
        figuresUpdatedAt: "",
      },
      { [MINISTRY_FUNDING_GOALS_SETTING]: true },
    ),
    sec("functions-heading", "text_section", "Ministry functions heading", {
      headline: MINISTRY_FUNDING_FUNCTIONS_HEADING,
      body: MINISTRY_FUNDING_FUNCTIONS_INTRO,
    }),
    sec(
      "allocation",
      "card_grid",
      "Estimated investment by function",
      {
        headline: MINISTRY_FUNDING_CHART.title,
        intro: MINISTRY_FUNDING_CHART.explanation,
        body: MINISTRY_FUNDING_CHART.distinction,
        awaitingCopy: MINISTRY_FUNDING_CHART.awaitingCopy,
        reportingMonth: "",
        reportingMonthKey: "",
        expenseTotal: "",
        missionShareAmount: "",
        /** "true" | "false" string for Site Builder text fields */
        missionShareIncludedInExpenseTotal: "true",
        missionShareLabel: MISSION_SHARE_CATEGORY.name,
        missionShareDescription: MISSION_SHARE_CATEGORY.description,
        zoamSnapshot: null,
        zoamSnapshotHistory: [],
        zoamExportedAt: "",
        zoamSchemaVersion: "",
        zoamSourceApplication: "",
        zoamReconciliationStatus: "",
        cards: functionCards(),
      },
      { [MINISTRY_FUNDING_ALLOCATION_SETTING]: true },
    ),
    sec("invitation", "cta", "Partnership invitation", {
      headline: MINISTRY_FUNDING_INVITATION.title,
      body: MINISTRY_FUNDING_INVITATION.body,
      primaryCtaLabel: MINISTRY_FUNDING_INVITATION.primaryCtaLabel,
      primaryCtaUrl: MINISTRY_FUNDING_INVITATION.primaryCtaUrl,
      secondaryCtaLabel: "",
      secondaryCtaUrl: "",
    }),
  ].map((section, index) => ({ ...section, sortOrder: index }));
}

/** Idempotent: add missing default sections without overwriting existing copy. */
export function migrateMinistryFundingSections(sections: PageSection[]): {
  sections: PageSection[];
  changed: boolean;
} {
  const defaults = defaultMinistryFundingSections();
  let changed = false;
  const next = [...sections];
  const present = new Set(next.map((s) => s.sectionKey));

  for (let i = 0; i < defaults.length; i++) {
    const d = defaults[i]!;
    if (present.has(d.sectionKey)) continue;
    let insertAt = next.length;
    for (let j = i - 1; j >= 0; j--) {
      const predIdx = next.findIndex((s) => s.sectionKey === defaults[j]!.sectionKey);
      if (predIdx >= 0) {
        insertAt = predIdx + 1;
        break;
      }
    }
    next.splice(insertAt, 0, d);
    present.add(d.sectionKey);
    changed = true;
  }

  const normalized = next.map((s, i) => {
    let row = { ...s, pageKey: MINISTRY_FUNDING_PAGE_KEY, sortOrder: i };
    if (row.sectionKey === "funding-goals" && !isMinistryFundingGoalsSection(row)) {
      row = {
        ...row,
        settings: { ...row.settings, [MINISTRY_FUNDING_GOALS_SETTING]: true },
      };
      changed = true;
    }
    if (row.sectionKey === "allocation" && !isMinistryFundingAllocationSection(row)) {
      row = {
        ...row,
        settings: { ...row.settings, [MINISTRY_FUNDING_ALLOCATION_SETTING]: true },
      };
      changed = true;
    }
    // Seed the functions-heading intro when the section still has an empty body.
    if (row.sectionKey === "functions-heading") {
      const body = typeof row.content.body === "string" ? row.content.body.trim() : "";
      if (!body) {
        row = {
          ...row,
          content: { ...row.content, body: MINISTRY_FUNDING_FUNCTIONS_INTRO },
        };
        changed = true;
      }
    }
    // Refresh legacy chart explanation / overlapping distinction copy.
    if (row.sectionKey === "allocation") {
      const intro = typeof row.content.intro === "string" ? row.content.intro.trim() : "";
      const distinction = typeof row.content.body === "string" ? row.content.body.trim() : "";
      let nextContent = row.content;
      if (
        MINISTRY_FUNDING_CHART_EXPLANATION_LEGACY.some((legacy) => legacy === intro) ||
        /Mission Share is (excluded|tracked separately|shown separately)/i.test(intro)
      ) {
        nextContent = { ...nextContent, intro: MINISTRY_FUNDING_CHART.explanation };
        changed = true;
      }
      if (MINISTRY_FUNDING_CHART_DISTINCTION_LEGACY.some((legacy) => legacy === distinction)) {
        nextContent = { ...nextContent, body: MINISTRY_FUNDING_CHART.distinction };
        changed = true;
      }
      if (nextContent !== row.content) {
        row = { ...row, content: nextContent };
      }
    }
    if (row.sectionKey === "invitation") {
      let nextContent = row.content;
      const body = typeof row.content.body === "string" ? row.content.body.trim() : "";
      if (MINISTRY_FUNDING_INVITATION_BODY_LEGACY.some((legacy) => legacy === body)) {
        nextContent = { ...nextContent, body: MINISTRY_FUNDING_INVITATION.body };
        changed = true;
      }
      const primaryUrl =
        typeof row.content.primaryCtaUrl === "string" ? row.content.primaryCtaUrl.trim() : "";
      if (!primaryUrl || isLegacyGivingHref(primaryUrl)) {
        nextContent = {
          ...nextContent,
          primaryCtaUrl: MINISTRY_FUNDING_INVITATION.primaryCtaUrl,
        };
        changed = true;
      }
      if (nextContent !== row.content) {
        row = { ...row, content: nextContent };
      }
    }
    return row;
  });

  const same =
    !changed &&
    normalized.length === sections.length &&
    normalized.every(
      (s, i) =>
        s.sectionKey === sections[i]?.sectionKey &&
        s.sortOrder === sections[i]?.sortOrder &&
        s.pageKey === sections[i]?.pageKey,
    );

  if (same) return { sections, changed: false };
  return { sections: normalized, changed: true };
}

export function prepareMinistryFundingAdminSections(stored: PageSection[]): PageSection[] {
  if (stored.length === 0) return defaultMinistryFundingSections();
  return migrateMinistryFundingSections(stored).sections;
}

/**
 * Our Mission Site Builder content.
 *
 * All narrative/framework copy is stored as normal Site Builder sections (defaults
 * from our-mission-content). The live tracker section is presentationally editable
 * (visibility/label/heading) but its totals always come from ministry record aggregates.
 */

import {
  OUR_MISSION_AVENUES,
  OUR_MISSION_AVENUES_TITLE,
  OUR_MISSION_BEYOND,
  OUR_MISSION_CTAS,
  OUR_MISSION_FUNCTIONS,
  OUR_MISSION_FUNCTIONS_TITLE,
  OUR_MISSION_HERO,
  OUR_MISSION_INVITATION,
  OUR_MISSION_MEASURE_LABEL,
  OUR_MISSION_MEASUREMENT,
} from "@/data/our-mission-content";
import type { PageSection, SectionType } from "./types";
import { registryFor } from "./registry";

export const OUR_MISSION_PAGE_KEY = "our-mission" as const;

/** Marks sections whose wording explains the approved framework (warning only). */
export const OUR_MISSION_FRAMEWORK_EDITORIAL_SETTING = "ministryFrameworkEditorial";

/** Marks the live tracker host — totals stay data-bound. */
export const OUR_MISSION_LIVE_TRACKER_SETTING = "liveMinistryTracker";

export const OUR_MISSION_FRAMEWORK_EDITORIAL_WARNING =
  "These descriptions explain the approved Ministry Impact Framework. Changes to this wording do not change the underlying milestone qualifications or tracker calculations. Please ensure the published explanation remains accurate.";

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
    pageKey: OUR_MISSION_PAGE_KEY,
    sectionKey,
    sectionType,
    label,
    visible: true,
    sortOrder: 0,
    content: { ...reg.defaultContent, ...content },
    settings: { ...reg.defaultSettings, ...settings },
  };
}

function listItems(strings: string[]) {
  return strings.map((text, i) => ({
    id: `ln-${i}`,
    text,
    visible: true,
    sortOrder: i,
    metadata: {},
  }));
}

function cardItems(
  cards: Array<{
    title: string;
    body: string;
    meta?: Record<string, unknown>;
  }>,
) {
  return cards.map((c, i) => ({
    id: `card-${i}`,
    text: c.title,
    visible: true,
    sortOrder: i,
    metadata: { body: c.body, ...c.meta },
  }));
}

export function isOurMissionLiveTrackerSection(section: PageSection): boolean {
  return (
    section.settings?.[OUR_MISSION_LIVE_TRACKER_SETTING] === true ||
    section.sectionKey === "tracker"
  );
}

export function isOurMissionFrameworkEditorialSection(section: PageSection): boolean {
  return section.settings?.[OUR_MISSION_FRAMEWORK_EDITORIAL_SETTING] === true;
}

/** @deprecated Protected CMS locking removed — always false. */
export function isOurMissionProtectedSection(_section: PageSection): boolean {
  return false;
}

/** Full default Our Mission page as Site Builder sections. */
export function defaultOurMissionEditableSections(): PageSection[] {
  const framework = { [OUR_MISSION_FRAMEWORK_EDITORIAL_SETTING]: true };

  const avenueSections = OUR_MISSION_AVENUES.map((avenue, avenueIndex) => {
    const bullets: Array<{
      id: string;
      text: string;
      visible: boolean;
      sortOrder: number;
      metadata: Record<string, unknown>;
    }> = [];
    let sort = 0;
    for (const track of avenue.tracks) {
      const trackTitle = track.title ?? "";
      for (const q of track.qualifications) {
        bullets.push({
          id: `q-${avenue.id}-${sort}`,
          text: `${q.label}: ${q.text}`,
          visible: true,
          sortOrder: sort++,
          metadata: {
            kind: "qualification",
            label: q.label,
            trackTitle,
          },
        });
      }
      for (const note of track.notes) {
        bullets.push({
          id: `n-${avenue.id}-${sort}`,
          text: note,
          visible: true,
          sortOrder: sort++,
          metadata: { kind: "note", trackTitle },
        });
      }
    }

    return sec(
      `avenue-${avenue.id}`,
      "text_section",
      `Avenue ${avenueIndex + 1}: ${avenue.title}`,
      {
        eyebrow: `Avenue ${avenueIndex + 1}`,
        headline: avenue.title,
        subheadline: avenue.summary,
        body: avenue.paragraphs.join("\n\n"),
        bullets,
        measureLabel: OUR_MISSION_MEASURE_LABEL,
      },
      { ...framework, ourMissionAvenue: true },
    );
  });

  return [
    sec("hero", "hero", "Hero & ministry vision", {
      headline: OUR_MISSION_HERO.title,
      subheadline: OUR_MISSION_HERO.supporting,
      body: OUR_MISSION_HERO.paragraphs.join("\n\n"),
      primaryCtaLabel: "",
      secondaryCtaLabel: "",
      tertiaryCtaLabel: "",
    }),
    sec(
      "tracker",
      "text_section",
      "Live Ministry Impact Tracker",
      {
        headline: "The Progress So Far",
        body: "Live totals from ministry records. Presentation can be shown or hidden; totals are not manually editable.",
      },
      { [OUR_MISSION_LIVE_TRACKER_SETTING]: true },
    ),
    sec(
      "functions",
      "card_grid",
      "Mobilize, Train & Equip, Send",
      {
        headline: OUR_MISSION_FUNCTIONS_TITLE,
        intro: "",
        cards: cardItems(
          OUR_MISSION_FUNCTIONS.map((item) => ({
            title: item.title,
            body: item.paragraphs.join("\n\n"),
            meta: { amountLabel: item.subtitle },
          })),
        ),
      },
      framework,
    ),
    sec(
      "avenues-heading",
      "text_section",
      "Three ministry avenues heading",
      {
        headline: OUR_MISSION_AVENUES_TITLE,
        body: "",
      },
      framework,
    ),
    ...avenueSections,
    sec("beyond", "text_section", "Continued coaching", {
      headline: OUR_MISSION_BEYOND.title,
      body: OUR_MISSION_BEYOND.paragraphs.join("\n\n"),
    }),
    sec(
      "measurement",
      "text_section",
      "How We Measure Progress",
      {
        headline: OUR_MISSION_MEASUREMENT.title,
        body: OUR_MISSION_MEASUREMENT.intro,
        bullets: listItems([...OUR_MISSION_MEASUREMENT.points]),
      },
      framework,
    ),
    sec("invitation", "cta", "Invitation & CTAs", {
      headline: OUR_MISSION_INVITATION.title,
      body: OUR_MISSION_INVITATION.paragraphs.join("\n\n"),
      primaryCtaLabel: OUR_MISSION_CTAS[0]?.label ?? "Partner With Us",
      primaryCtaUrl: OUR_MISSION_CTAS[0]?.href ?? "/partner",
      secondaryCtaLabel: OUR_MISSION_CTAS[1]?.label ?? "Explore Opportunities to Serve",
      secondaryCtaUrl: OUR_MISSION_CTAS[1]?.href ?? "/contact",
    }),
  ].map((section, index) => ({ ...section, sortOrder: index }));
}

/**
 * Ensure older Our Mission saves (hero/beyond/invitation only) gain the full editable
 * framework sections without overwriting existing copy. Idempotent.
 */
export function migrateOurMissionFullEditSections(sections: PageSection[]): {
  sections: PageSection[];
  changed: boolean;
} {
  const defaults = defaultOurMissionEditableSections();
  const byKey = new Map(sections.map((s) => [s.sectionKey, s]));
  const defaultKeys = new Set(defaults.map((d) => d.sectionKey));

  let changed = false;
  const ordered: PageSection[] = [];
  const used = new Set<string>();

  for (const d of defaults) {
    const existing = byKey.get(d.sectionKey);
    if (existing) {
      let row = existing;
      const missingSettings: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(d.settings ?? {})) {
        if (existing.settings?.[key] === undefined) missingSettings[key] = value;
      }
      if (Object.keys(missingSettings).length > 0) {
        row = { ...existing, settings: { ...existing.settings, ...missingSettings } };
        changed = true;
      }
      if (d.sectionKey === "tracker" && !isOurMissionLiveTrackerSection(row)) {
        row = {
          ...row,
          settings: { ...row.settings, [OUR_MISSION_LIVE_TRACKER_SETTING]: true },
        };
        changed = true;
      }
      ordered.push(row);
    } else {
      ordered.push(d);
      changed = true;
    }
    used.add(d.sectionKey);
  }

  const supplemental: PageSection[] = [];
  for (const s of sections) {
    if (used.has(s.sectionKey)) continue;
    // Drop obsolete virtual protected placeholders that were never real CMS content.
    if (
      s.settings?.ministryFrameworkProtected === true &&
      !defaultKeys.has(s.sectionKey) &&
      (s.sectionKey === "avenues" || s.sectionKey === "functions" || s.sectionKey === "measurement")
    ) {
      changed = true;
      continue;
    }
    supplemental.push(s);
  }
  // Keep supplemental editorial before the closing invitation (prior Our Mission layout).
  if (supplemental.length > 0) {
    const invitationIndex = ordered.findIndex((s) => s.sectionKey === "invitation");
    if (invitationIndex >= 0) {
      ordered.splice(invitationIndex, 0, ...supplemental);
    } else {
      ordered.push(...supplemental);
    }
  }

  const next = ordered.map((s, i) => ({
    ...s,
    pageKey: OUR_MISSION_PAGE_KEY,
    sortOrder: i,
  }));

  const sameShape =
    next.length === sections.length &&
    next.every(
      (s, i) =>
        s.sectionKey === sections[i]?.sectionKey &&
        s.sortOrder === sections[i]?.sortOrder &&
        s.pageKey === sections[i]?.pageKey &&
        s === sections[i],
    );

  if (sameShape) {
    return { sections, changed: false };
  }

  // Settings/content rows may be equivalent even when references differ.
  const sameKeys =
    next.length === sections.length &&
    next.every((s, i) => s.sectionKey === sections[i]?.sectionKey);
  if (sameKeys && !changed) {
    return { sections, changed: false };
  }

  return { sections: next, changed: true };
}

/** Admin load / restore helper. */
export function prepareOurMissionAdminSections(stored: PageSection[]): PageSection[] {
  if (stored.length === 0) return defaultOurMissionEditableSections();
  return migrateOurMissionFullEditSections(stored).sections;
}

/** @deprecated Use prepareOurMissionAdminSections */
export function mergeOurMissionAdminSections(stored: PageSection[]): PageSection[] {
  return prepareOurMissionAdminSections(stored);
}

/** Identity — framework sections persist like any other page content. */
export function stripOurMissionProtectedSections(sections: PageSection[]): PageSection[] {
  return sections;
}

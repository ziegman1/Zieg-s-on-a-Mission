/**
 * Our Mission Site Builder content.
 *
 * All presentation copy is normal Site Builder sections (defaults from
 * our-mission-content). The tracker section binds totals from ministry aggregates;
 * presentation around those totals is fully editable.
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
  OUR_MISSION_MEASUREMENT,
} from "@/data/our-mission-content";
import type { PageSection, SectionType } from "./types";
import { registryFor } from "./registry";

export const OUR_MISSION_PAGE_KEY = "our-mission" as const;

/** Marks the live tracker host — totals stay data-bound; presentation is editable. */
export const OUR_MISSION_LIVE_TRACKER_SETTING = "liveMinistryTracker";

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

/** Strip obsolete restriction flags without touching content. */
function scrubRestrictionSettings(section: PageSection): {
  section: PageSection;
  changed: boolean;
} {
  const settings = { ...(section.settings ?? {}) };
  let changed = false;
  for (const key of [
    "ministryFrameworkProtected",
    "ministryFrameworkEditorial",
  ] as const) {
    if (key in settings) {
      delete settings[key];
      changed = true;
    }
  }
  if (!changed) return { section, changed: false };
  return { section: { ...section, settings }, changed: true };
}

function isOurMissionAvenueSection(section: PageSection): boolean {
  return (
    section.settings?.ourMissionAvenue === true || section.sectionKey.startsWith("avenue-")
  );
}

/** Drop per-avenue “How We Measure Progress” accordion fields from saved content. */
function stripAvenueMeasureAccordion(section: PageSection): {
  section: PageSection;
  changed: boolean;
} {
  if (!isOurMissionAvenueSection(section)) {
    return { section, changed: false };
  }
  const content = { ...(section.content ?? {}) };
  let changed = false;
  const bullets = content.bullets;
  if (Array.isArray(bullets) && bullets.length > 0) {
    content.bullets = [];
    changed = true;
  } else if ("bullets" in content && bullets !== undefined && !Array.isArray(bullets)) {
    delete content.bullets;
    changed = true;
  }
  if ("measureLabel" in content) {
    delete content.measureLabel;
    changed = true;
  }
  if (!changed) return { section, changed: false };
  return { section: { ...section, content }, changed: true };
}

/** Full default Our Mission page as Site Builder sections. */
export function defaultOurMissionEditableSections(): PageSection[] {
  const avenueSections = OUR_MISSION_AVENUES.map((avenue, avenueIndex) =>
    sec(
      `avenue-${avenue.id}`,
      "text_section",
      `Avenue ${avenueIndex + 1}: ${avenue.title}`,
      {
        eyebrow: `Avenue ${avenueIndex + 1}`,
        headline: avenue.title,
        subheadline: avenue.summary,
        body: avenue.paragraphs.join("\n\n"),
        bullets: [],
      },
      { ourMissionAvenue: true },
    ),
  );

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
      "Ministry Impact Tracker",
      {
        headline: "The Progress So Far",
        body: "",
        mobilizedLabel: "Mobilized",
        trainedLabel: "Trained & Equipped",
        sentLabel: "Sent",
        remainingDetail: "to reach the unreached by August 31, 2031.",
      },
      { [OUR_MISSION_LIVE_TRACKER_SETTING]: true },
    ),
    sec("functions", "card_grid", "Mobilize, Train & Equip, Send", {
      headline: OUR_MISSION_FUNCTIONS_TITLE,
      intro: "",
      cards: cardItems(
        OUR_MISSION_FUNCTIONS.map((item) => ({
          title: item.title,
          body: item.paragraphs.join("\n\n"),
          meta: { amountLabel: item.subtitle },
        })),
      ),
    }),
    sec("avenues-heading", "text_section", "Three ministry avenues heading", {
      headline: OUR_MISSION_AVENUES_TITLE,
      body: "",
    }),
    ...avenueSections,
    sec("beyond", "text_section", "Continued coaching", {
      headline: OUR_MISSION_BEYOND.title,
      body: OUR_MISSION_BEYOND.paragraphs.join("\n\n"),
    }),
    sec("measurement", "text_section", "How We Measure Progress", {
      headline: OUR_MISSION_MEASUREMENT.title,
      body: OUR_MISSION_MEASUREMENT.intro,
      bullets: listItems([...OUR_MISSION_MEASUREMENT.points]),
    }),
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
 * Add any missing default sections without reordering or overwriting existing
 * content. Idempotent and non-destructive.
 */
export function migrateOurMissionFullEditSections(sections: PageSection[]): {
  sections: PageSection[];
  changed: boolean;
} {
  const defaults = defaultOurMissionEditableSections();
  const defaultKeys = new Set(defaults.map((d) => d.sectionKey));

  let changed = false;
  let next: PageSection[] = [];

  for (const s of sections) {
    // Drop obsolete virtual protected placeholders that were never real CMS content.
    if (
      s.settings?.ministryFrameworkProtected === true &&
      !defaultKeys.has(s.sectionKey) &&
      (s.sectionKey === "avenues" ||
        s.sectionKey === "functions" ||
        s.sectionKey === "measurement" ||
        s.sectionKey === "tracker")
    ) {
      // Only drop if there is essentially no editable content (legacy placeholder).
      const hasContent = Boolean(
        s.content?.headline || s.content?.body || s.content?.cards || s.content?.bullets,
      );
      if (!hasContent) {
        changed = true;
        continue;
      }
    }
    const scrubbed = scrubRestrictionSettings(s);
    if (scrubbed.changed) changed = true;
    let row = scrubbed.section;
    const stripped = stripAvenueMeasureAccordion(row);
    if (stripped.changed) changed = true;
    row = stripped.section;
    if (row.sectionKey === "tracker" && !isOurMissionLiveTrackerSection(row)) {
      row = {
        ...row,
        settings: { ...row.settings, [OUR_MISSION_LIVE_TRACKER_SETTING]: true },
      };
      changed = true;
    }
    next.push(row);
  }

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
    if (insertAt === next.length) {
      for (let j = i + 1; j < defaults.length; j++) {
        const succIdx = next.findIndex((s) => s.sectionKey === defaults[j]!.sectionKey);
        if (succIdx >= 0) {
          insertAt = succIdx;
          break;
        }
      }
    }
    next.splice(insertAt, 0, d);
    present.add(d.sectionKey);
    changed = true;
  }

  const normalized = next.map((s, i) => ({
    ...s,
    pageKey: OUR_MISSION_PAGE_KEY,
    sortOrder: i,
  }));

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

/** Admin load / restore helper. */
export function prepareOurMissionAdminSections(stored: PageSection[]): PageSection[] {
  if (stored.length === 0) return defaultOurMissionEditableSections();
  return migrateOurMissionFullEditSections(stored).sections;
}

/** @deprecated Use prepareOurMissionAdminSections */
export function mergeOurMissionAdminSections(stored: PageSection[]): PageSection[] {
  return prepareOurMissionAdminSections(stored);
}

/** @deprecated Restriction locking removed. */
export function isOurMissionProtectedSection(_section: PageSection): boolean {
  return false;
}

/** @deprecated Editorial warning removed. */
export function isOurMissionFrameworkEditorialSection(_section: PageSection): boolean {
  return false;
}

/** @deprecated Identity — all sections persist. */
export function stripOurMissionProtectedSections(sections: PageSection[]): PageSection[] {
  return sections;
}

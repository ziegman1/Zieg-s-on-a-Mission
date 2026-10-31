import type { PageSection } from "./types";

/**
 * Which homepage section shows the ministry progress tracker in its empty visual column.
 *
 * Identification is deliberately not positional. `sectionKey` is unique per page
 * (`@@unique([pageKey, sectionKey])` on SitePageSection), so it survives reordering, relabelling,
 * and visibility changes in the site builder.
 *
 * `guided-merch` is the homepage section beside the tracker. If that content ever moves,
 * set `settings.ministryProgressTracker = true` on the new section and it takes precedence with
 * no code change.
 */
export const MINISTRY_PROGRESS_SECTION_KEY = "guided-merch";

export const MINISTRY_PROGRESS_SETTING = "ministryProgressTracker";

/** True when a section explicitly opts in via its site-builder settings. */
export function hasMinistryProgressOptIn(section: PageSection): boolean {
  return section.settings?.[MINISTRY_PROGRESS_SETTING] === true;
}

/**
 * Resolve the one section that should host the tracker.
 *
 * An explicit opt-in anywhere on the page wins outright, so designating a new section
 * automatically stops the tracker rendering beside the old one. Otherwise falls back to the
 * known section key. Returns null when neither is present.
 */
export function resolveMinistryProgressSectionKey(sections: PageSection[]): string | null {
  const optIn = sections.find(hasMinistryProgressOptIn);
  if (optIn) return optIn.sectionKey;

  const fallback = sections.find(
    (section) => section.sectionKey === MINISTRY_PROGRESS_SECTION_KEY,
  );
  return fallback ? fallback.sectionKey : null;
}

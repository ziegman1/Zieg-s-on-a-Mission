import { ABOUT_MISSION_PAGE_CONTENT } from "@/data/about-mission-page-content";
import { defaultSectionsForPage } from "./defaults";
import type { PageSection } from "./types";

/** True when saved About sections still use the pre–About & Mission layout. */
export function aboutNeedsMissionPageMigration(sections: PageSection[]): boolean {
  if (sections.length === 0) return false;
  return !sections.some((s) => s.sectionKey === "story");
}

/**
 * Replace legacy About layouts with the current About & Mission default sections.
 * Preserves nothing from the old section list — use only when adopting the new page structure.
 */
export function migrateAboutMissionPageSections(sections: PageSection[]): {
  sections: PageSection[];
  changed: boolean;
} {
  if (!aboutNeedsMissionPageMigration(sections)) {
    return { sections, changed: false };
  }

  return { sections: defaultSectionsForPage("about"), changed: true };
}

export { ABOUT_MISSION_PAGE_CONTENT };

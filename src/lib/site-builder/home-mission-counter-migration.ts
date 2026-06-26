import { defaultSectionsForPage } from "./defaults";
import type { PageSection } from "./types";

/** True when saved Home has a hero but no mission_counter section yet. */
export function homeNeedsMissionCounterMigration(sections: PageSection[]): boolean {
  if (sections.length === 0) return false;
  if (sections.some((s) => s.sectionType === "mission_counter" || s.sectionKey === "mission-counter")) {
    return false;
  }
  return sections.some((s) => s.sectionType === "hero" || s.sectionKey === "hero");
}

function defaultHomeMissionCounterSection(): PageSection | undefined {
  return defaultSectionsForPage("home").find((s) => s.sectionKey === "mission-counter");
}

/**
 * Insert the Mission counter directly after the Home hero.
 * Preserves all existing sections and copy.
 */
export function insertHomeMissionCounterAfterHero(sections: PageSection[]): {
  sections: PageSection[];
  changed: boolean;
} {
  if (!homeNeedsMissionCounterMigration(sections)) {
    return { sections, changed: false };
  }

  const counterTemplate = defaultHomeMissionCounterSection();
  if (!counterTemplate) {
    return { sections, changed: false };
  }

  const heroIndex = sections.findIndex((s) => s.sectionKey === "hero" || s.sectionType === "hero");
  const insertAt = heroIndex >= 0 ? heroIndex + 1 : 0;

  const counter: PageSection = {
    ...counterTemplate,
    id: `mission-counter-${Date.now()}`,
    pageKey: "home",
    sortOrder: insertAt,
  };

  const next = [
    ...sections.slice(0, insertAt),
    counter,
    ...sections.slice(insertAt),
  ].map((section, index) => ({ ...section, sortOrder: index }));

  return { sections: next, changed: true };
}

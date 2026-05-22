import type { PageSection } from "./types";

/** Immutable content field update for a single section. */
export function patchSectionContent(
  section: PageSection,
  fieldKey: string,
  value: unknown,
): PageSection {
  return {
    ...section,
    content: {
      ...section.content,
      [fieldKey]: value,
    },
  };
}

export function replaceSectionInList(
  sections: PageSection[],
  sectionId: string,
  next: PageSection,
): PageSection[] {
  return sections.map((s) => (s.id === sectionId ? next : s));
}

export function updateSectionInList(
  sections: PageSection[],
  sectionId: string,
  updater: (section: PageSection) => PageSection,
): PageSection[] {
  return sections.map((s) => (s.id === sectionId ? updater(s) : s));
}

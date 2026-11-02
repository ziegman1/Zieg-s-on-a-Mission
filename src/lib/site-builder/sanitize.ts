import type { PageSection } from "./types";

/** Strip undefined/non-JSON values so Prisma Json columns accept the payload. */
export function sanitizeJsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function prepareSectionsForSave(
  pageKey: string,
  sections: PageSection[],
): PageSection[] {
  const seen = new Set<string>();
  return sections.map((s, i) => {
    let key = s.sectionKey?.trim() || `section-${i}`;
    if (seen.has(key)) {
      key = `${key}-${i}`;
    }
    seen.add(key);
    return {
      ...s,
      pageKey,
      sectionKey: key,
      label: s.label ?? "",
      visible: Boolean(s.visible),
      sortOrder: i,
      content: sanitizeJsonRecord(s.content),
      settings: sanitizeJsonRecord(s.settings),
    };
  });
}

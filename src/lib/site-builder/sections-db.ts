import { cache } from "react";
import { prisma } from "@/lib/db";
import { defaultSectionsForPage } from "./defaults";
import type { ListItem, PageSection } from "./types";

function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function rowToSection(row: {
  id: string;
  pageKey: string;
  sectionKey: string;
  sectionType: string;
  label: string;
  visible: boolean;
  sortOrder: number;
  content: unknown;
  settings: unknown;
}): PageSection {
  return {
    id: row.id,
    pageKey: row.pageKey,
    sectionKey: row.sectionKey,
    sectionType: row.sectionType as PageSection["sectionType"],
    label: row.label,
    visible: row.visible,
    sortOrder: row.sortOrder,
    content:
      row.content && typeof row.content === "object" && !Array.isArray(row.content)
        ? (row.content as Record<string, unknown>)
        : {},
    settings:
      row.settings && typeof row.settings === "object" && !Array.isArray(row.settings)
        ? (row.settings as Record<string, unknown>)
        : {},
  };
}

export async function pageHasCustomSections(pageKey: string): Promise<boolean> {
  if (!hasDatabaseUrl()) return false;
  try {
    const count = await prisma.sitePageSection.count({ where: { pageKey } });
    return count > 0;
  } catch {
    return false;
  }
}

export async function loadPageSections(pageKey: string): Promise<PageSection[]> {
  if (!hasDatabaseUrl()) {
    return defaultSectionsForPage(pageKey);
  }
  try {
    const rows = await prisma.sitePageSection.findMany({
      where: { pageKey },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length === 0) {
      return defaultSectionsForPage(pageKey);
    }
    return rows.map(rowToSection);
  } catch {
    return defaultSectionsForPage(pageKey);
  }
}

export const getPublishedPageSections = cache(async (pageKey: string): Promise<PageSection[]> => {
  const sections = await loadPageSections(pageKey);
  const hasCustom = await pageHasCustomSections(pageKey);
  if (!hasCustom) {
    return sections.filter((s) => s.visible);
  }
  return sections.filter((s) => s.visible);
});

export async function loadPageSectionsForAdmin(pageKey: string): Promise<{
  sections: PageSection[];
  hasCustom: boolean;
}> {
  const hasCustom = await pageHasCustomSections(pageKey);
  const sections = await loadPageSections(pageKey);
  if (!hasCustom) {
    return { sections: defaultSectionsForPage(pageKey), hasCustom: false };
  }
  return { sections, hasCustom: true };
}

export async function savePageSections(
  pageKey: string,
  sections: PageSection[],
): Promise<void> {
  const data = sections.map((s, i) => ({
    pageKey,
    sectionKey: s.sectionKey,
    sectionType: s.sectionType,
    label: s.label,
    visible: s.visible,
    sortOrder: i,
    content: s.content as object,
    settings: s.settings as object,
  }));

  await prisma.$transaction([
    prisma.sitePageSection.deleteMany({ where: { pageKey } }),
    ...data.map((row) =>
      prisma.sitePageSection.create({
        data: {
          pageKey: row.pageKey,
          sectionKey: row.sectionKey,
          sectionType: row.sectionType,
          label: row.label,
          visible: row.visible,
          sortOrder: row.sortOrder,
          content: row.content,
          settings: row.settings,
        },
      }),
    ),
  ]);
}

export async function deletePageSections(pageKey: string): Promise<void> {
  await prisma.sitePageSection.deleteMany({ where: { pageKey } });
}


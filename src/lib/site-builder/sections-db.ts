import type { Prisma } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/db";
import { defaultSectionsForPage } from "./defaults";
import { migrateAboutPageSections } from "./about-page-migration";
import { migrateGivePageSections } from "./give-page-sections";
import { logSiteBuilderSaveError } from "./save-errors";
import { prepareSectionsForSave } from "./sanitize";
import type { PageSection } from "./types";

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
  noStore();
  if (!hasDatabaseUrl()) return false;
  try {
    const count = await prisma.sitePageSection.count({ where: { pageKey } });
    return count > 0;
  } catch (error) {
    logSiteBuilderSaveError(error, { op: "pageHasCustomSections", pageKey });
    return false;
  }
}

export async function loadPageSections(pageKey: string): Promise<PageSection[]> {
  noStore();
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
    let sections = rows.map(rowToSection);
    if (pageKey === "give") {
      const migrated = migrateGivePageSections(sections);
      if (migrated.changed) {
        sections = migrated.sections;
        try {
          await savePageSections(pageKey, sections);
        } catch (error) {
          logSiteBuilderSaveError(error, { op: "migrateGivePageSections", pageKey });
        }
      }
    }
    if (pageKey === "about") {
      const migrated = migrateAboutPageSections(sections);
      if (migrated.changed) {
        sections = migrated.sections;
        try {
          await savePageSections(pageKey, sections);
        } catch (error) {
          logSiteBuilderSaveError(error, { op: "migrateAboutPageSections", pageKey });
        }
      }
    }
    return sections;
  } catch (error) {
    logSiteBuilderSaveError(error, { op: "loadPageSections", pageKey });
    return defaultSectionsForPage(pageKey);
  }
}

export async function getPublishedPageSections(pageKey: string): Promise<PageSection[]> {
  const sections = await loadPageSections(pageKey);
  const hasCustom = await pageHasCustomSections(pageKey);
  if (!hasCustom) {
    return sections.filter((s) => s.visible);
  }
  return sections.filter((s) => s.visible);
}

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

export type SavePageSectionsResult = {
  savedCount: number;
  visibleCount: number;
  pageKey: string;
};

export async function savePageSections(
  pageKey: string,
  sections: PageSection[],
): Promise<SavePageSectionsResult> {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured. Cannot save site builder content.");
  }

  const prepared = prepareSectionsForSave(pageKey, sections);
  const rows = prepared.map((s, i) => ({
    pageKey,
    sectionKey: s.sectionKey,
    sectionType: s.sectionType,
    label: s.label,
    visible: s.visible,
    sortOrder: i,
    content: s.content,
    settings: s.settings,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.sitePageSection.deleteMany({ where: { pageKey } });
    if (rows.length > 0) {
      await tx.sitePageSection.createMany({
        data: rows.map((row) => ({
          ...row,
          content: row.content as Prisma.InputJsonValue,
          settings: row.settings as Prisma.InputJsonValue,
        })),
      });
    }
  });

  const savedCount = rows.length;
  const visibleCount = rows.filter((r) => r.visible).length;

  if (process.env.NODE_ENV === "development") {
    console.info(
      `[site-builder] saved ${savedCount} sections (${visibleCount} visible) for page_key=${pageKey}`,
    );
  }

  return { savedCount, visibleCount, pageKey };
}

export async function deletePageSections(pageKey: string): Promise<void> {
  await prisma.sitePageSection.deleteMany({ where: { pageKey } });
}

export async function getPageSectionsDiagnostics(pageKey: string): Promise<{
  rowCount: number;
  visibleCount: number;
  latestUpdatedAt: string | null;
}> {
  noStore();
  const rows = await prisma.sitePageSection.findMany({
    where: { pageKey },
    select: { visible: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
  return {
    rowCount: rows.length,
    visibleCount: rows.filter((r) => r.visible).length,
    latestUpdatedAt: rows[0]?.updatedAt?.toISOString() ?? null,
  };
}

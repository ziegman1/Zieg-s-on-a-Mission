import type { Prisma } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { migrateGivingUrlsInSectionContent } from "@/data/giving";
import { prisma } from "@/lib/db";
import { defaultSectionsForPage } from "./defaults";
import { migrateAboutMissionPageSections } from "./about-mission-migration";
import { insertHomeMissionCounterAfterHero } from "./home-mission-counter-migration";
import { migrateGivePageSections } from "./give-page-sections";
import { logSiteBuilderSaveError } from "./save-errors";
import { prepareSectionsForSave } from "./sanitize";
import {
  migrateOurMissionFullEditSections,
  prepareOurMissionAdminSections,
} from "./our-mission-page-sections";
import {
  migrateMinistryFundingSections,
  prepareMinistryFundingAdminSections,
} from "./ministry-funding-page-sections";
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

/** Rewrite legacy /give and Aplos URLs in CTA fields across any page. */
function migrateGivingUrlsInSections(sections: PageSection[]): {
  sections: PageSection[];
  changed: boolean;
} {
  let changed = false;
  const next = sections.map((row) => {
    const content = { ...row.content };
    if (!migrateGivingUrlsInSectionContent(content)) return row;
    changed = true;
    return { ...row, content };
  });
  return { sections: changed ? next : sections, changed };
}

/**
 * Apply one-shot page migrations in memory.
 * Persistence is opt-in so public GETs cannot race with admin saves and rewrite the DB.
 */
function migrateLoadedPageSections(
  pageKey: string,
  sections: PageSection[],
): { sections: PageSection[]; changed: boolean; op: string | null } {
  let current = sections;
  let changed = false;
  const ops: string[] = [];

  if (pageKey === "give") {
    const migrated = migrateGivePageSections(current);
    if (migrated.changed) {
      current = migrated.sections;
      changed = true;
      ops.push("migrateGivePageSections");
    }
  } else if (pageKey === "about") {
    const migrated = migrateAboutMissionPageSections(current);
    if (migrated.changed) {
      current = migrated.sections;
      changed = true;
      ops.push("migrateAboutMissionPageSections");
    }
  } else if (pageKey === "our-mission") {
    const migrated = migrateOurMissionFullEditSections(current);
    if (migrated.changed) {
      current = migrated.sections;
      changed = true;
      ops.push("migrateOurMissionFullEditSections");
    }
  } else if (pageKey === "ministry-funding") {
    const migrated = migrateMinistryFundingSections(current);
    if (migrated.changed) {
      current = migrated.sections;
      changed = true;
      ops.push("migrateMinistryFundingSections");
    }
  } else if (pageKey === "home") {
    const migrated = insertHomeMissionCounterAfterHero(current);
    if (migrated.changed) {
      current = migrated.sections;
      changed = true;
      ops.push("insertHomeMissionCounterAfterHero");
    }
  }

  const giving = migrateGivingUrlsInSections(current);
  if (giving.changed) {
    current = giving.sections;
    changed = true;
    ops.push("migrateGivingUrlsInSections");
  }

  return {
    sections: current,
    changed,
    op: ops.length > 0 ? ops.join("+") : null,
  };
}

export async function loadPageSections(
  pageKey: string,
  options?: { persistMigrations?: boolean },
): Promise<PageSection[]> {
  noStore();
  const persistMigrations = options?.persistMigrations === true;
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
    const migrated = migrateLoadedPageSections(pageKey, sections);
    sections = migrated.sections;
    if (migrated.changed && persistMigrations && migrated.op) {
      try {
        await savePageSections(pageKey, sections);
      } catch (error) {
        logSiteBuilderSaveError(error, { op: migrated.op, pageKey });
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
  // Admin loads may persist one-shot migrations so the editor matches what will save.
  const hasCustom = await pageHasCustomSections(pageKey);
  const sections = await loadPageSections(pageKey, { persistMigrations: true });
  const base = !hasCustom ? defaultSectionsForPage(pageKey) : sections;
  if (pageKey === "our-mission") {
    return { sections: prepareOurMissionAdminSections(base), hasCustom };
  }
  if (pageKey === "ministry-funding") {
    return { sections: prepareMinistryFundingAdminSections(base), hasCustom };
  }
  return { sections: base, hasCustom };
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
  if (prepared.length === 0) {
    const existingCount = await prisma.sitePageSection.count({ where: { pageKey } });
    if (existingCount > 0) {
      throw new Error(
        `Refusing to save an empty section list for "${pageKey}" because it would delete ${existingCount} existing section${existingCount === 1 ? "" : "s"}.`,
      );
    }
  }
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

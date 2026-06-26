"use server";

import { diagServerAction } from "@/lib/admin-builder-diagnostics";
import { revalidatePath } from "next/cache";
import { defaultSectionsForPage } from "@/lib/site-builder/defaults";
import { aboutNeedsMissionPageMigration, migrateAboutMissionPageSections } from "@/lib/site-builder/about-mission-migration";
import {
  deletePageSections,
  getPageSectionsDiagnostics,
  loadPageSectionsForAdmin,
  savePageSections,
} from "@/lib/site-builder/sections-db";
import {
  formatSiteBuilderSaveError,
  logSiteBuilderSaveError,
} from "@/lib/site-builder/save-errors";
import { contentStr } from "@/lib/site-builder/content-utils";
import type { PageSection } from "@/lib/site-builder/types";
import { BUILDER_PAGES, PAGE_REVALIDATE_PATHS } from "@/lib/site-builder/types";
import { requireAdminSession } from "@/lib/admin-auth";

function logSavePayload(pageKey: string, sections: PageSection[]) {
  const sample = sections.slice(0, 12).map((s) => ({
    section_key: s.sectionKey,
    section_type: s.sectionType,
    headline: contentStr(s.content, "headline").slice(0, 120),
    body: contentStr(s.content, "body").slice(0, 120),
  }));
  console.info("[site-builder] save payload", {
    page_key: pageKey,
    section_count: sections.length,
    sections: sample,
  });
}

const ALL_PAGE_KEYS = BUILDER_PAGES.map((p) => p.pageKey);

function pageLabel(pageKey: string): string {
  return BUILDER_PAGES.find((p) => p.pageKey === pageKey)?.label ?? pageKey;
}

async function revalidateForPage(pageKey: string) {
  const paths = PAGE_REVALIDATE_PATHS[pageKey] ?? [];
  for (const p of paths) {
    revalidatePath(p, "page");
  }
  if (pageKey === "global" || pageKey === "home") {
    revalidatePath("/", "page");
    revalidatePath("/", "layout");
  }
}

export async function loadBuilderPageAction(pageKey: string) {
  diagServerAction("loadBuilderPageAction", { pageKey });
  const session = await requireAdminSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  try {
    const data = await loadPageSectionsForAdmin(pageKey);
    return { ok: true as const, ...data };
  } catch (e) {
    logSiteBuilderSaveError(e, { op: "loadBuilderPageAction", pageKey });
    return {
      ok: false as const,
      error: formatSiteBuilderSaveError(e),
    };
  }
}

export type SaveBuilderPageSuccess = {
  ok: true;
  savedCount: number;
  visibleCount: number;
  pageKey: string;
  pageLabel: string;
  message: string;
  diagnostics: {
    rowCount: number;
    visibleCount: number;
    latestUpdatedAt: string | null;
  };
};

export async function saveBuilderPageAction(
  pageKey: string,
  sections: PageSection[],
): Promise<SaveBuilderPageSuccess | { ok: false; error: string }> {
  diagServerAction("saveBuilderPageAction", { pageKey, sectionCount: sections.length });
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  try {
    logSavePayload(pageKey, sections);
    const result = await savePageSections(pageKey, sections);
    await revalidateForPage(pageKey);
    const diagnostics = await getPageSectionsDiagnostics(pageKey);
    const label = pageLabel(pageKey);
    const message = `Saved and revalidated ${result.savedCount} section${result.savedCount === 1 ? "" : "s"} for ${label}`;

    return {
      ok: true,
      savedCount: result.savedCount,
      visibleCount: result.visibleCount,
      pageKey,
      pageLabel: label,
      message,
      diagnostics,
    };
  } catch (e) {
    logSiteBuilderSaveError(e, {
      op: "saveBuilderPageAction",
      pageKey,
      sectionCount: sections.length,
    });
    const detail = formatSiteBuilderSaveError(e);
    const error =
      process.env.NODE_ENV === "development"
        ? detail
        : detail.includes("site_page_sections") || detail.includes("migrate")
          ? detail
          : `Could not save page sections. ${detail}`;
    return { ok: false, error };
  }
}

export async function applyAboutMissionPageAction(currentSections: PageSection[]) {
  const session = await requireAdminSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const migrated = migrateAboutMissionPageSections(currentSections);
  if (!migrated.changed) {
    return {
      ok: true as const,
      sections: currentSections,
      hasCustom: true,
      message: "About page already uses the About & Mission layout.",
      saved: false,
    };
  }

  try {
    await savePageSections("about", migrated.sections);
    await revalidateForPage("about");
    return {
      ok: true as const,
      sections: migrated.sections,
      hasCustom: true,
      saved: true,
      message:
        "Applied the About & Mission page layout. Review each section in the preview, edit copy as needed, then save.",
    };
  } catch (e) {
    logSiteBuilderSaveError(e, { op: "applyAboutMissionPageAction", pageKey: "about" });
    return { ok: false as const, error: formatSiteBuilderSaveError(e) };
  }
}

export async function restoreBuilderPageDefaultsAction(pageKey: string) {
  const session = await requireAdminSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  return { ok: true as const, sections: defaultSectionsForPage(pageKey) };
}

export async function restoreBuilderSectionDefaultsAction(
  pageKey: string,
  sectionKey: string,
  currentSections: PageSection[],
) {
  const session = await requireAdminSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };

  const defaults = defaultSectionsForPage(pageKey);
  const def = defaults.find((s) => s.sectionKey === sectionKey);
  if (!def) return { ok: false as const, error: "Section not found in defaults" };

  const sections = currentSections.map((s) =>
    s.sectionKey === sectionKey ? { ...def, id: s.id } : s,
  );
  return { ok: true as const, sections };
}

export async function publishAllBuilderPagesAction(
  pageKey: string,
  sections: PageSection[],
): Promise<
  | { ok: true; message: string; revalidated: string[] }
  | { ok: false; error: string }
> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  try {
    const saveResult = await savePageSections(pageKey, sections);
    const revalidated: string[] = [];

    for (const key of ALL_PAGE_KEYS) {
      const paths = PAGE_REVALIDATE_PATHS[key] ?? [];
      for (const p of paths) {
        revalidatePath(p, "page");
        if (!revalidated.includes(p)) revalidated.push(p);
      }
    }
    revalidatePath("/", "page");
    revalidatePath("/", "layout");
    revalidatePath("/community", "page");

    const label = pageLabel(pageKey);
    return {
      ok: true,
      message: `Saved and revalidated ${saveResult.savedCount} section${saveResult.savedCount === 1 ? "" : "s"} for ${label} (${revalidated.length} paths)`,
      revalidated,
    };
  } catch (e) {
    logSiteBuilderSaveError(e, { op: "publishAllBuilderPagesAction", pageKey });
    return { ok: false, error: formatSiteBuilderSaveError(e) };
  }
}

export async function clearBuilderPageCustomAction(pageKey: string) {
  const session = await requireAdminSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  try {
    await deletePageSections(pageKey);
    await revalidateForPage(pageKey);
    return { ok: true as const, sections: defaultSectionsForPage(pageKey), hasCustom: false };
  } catch (e) {
    return { ok: false as const, error: formatSiteBuilderSaveError(e) };
  }
}

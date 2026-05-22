"use server";

import { revalidatePath } from "next/cache";
import { defaultSectionsForPage } from "@/lib/site-builder/defaults";
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
import type { PageSection } from "@/lib/site-builder/types";
import { BUILDER_PAGES, PAGE_REVALIDATE_PATHS } from "@/lib/site-builder/types";
import { requireAdminSession } from "@/lib/admin-auth";

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
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  try {
    const result = await savePageSections(pageKey, sections);
    await revalidateForPage(pageKey);
    const diagnostics = await getPageSectionsDiagnostics(pageKey);
    const label = pageLabel(pageKey);
    const message = `Saved ${result.savedCount} section${result.savedCount === 1 ? "" : "s"} for ${label}`;

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
      message: `Published ${saveResult.savedCount} section${saveResult.savedCount === 1 ? "" : "s"} for ${label} and refreshed ${revalidated.length} storefront paths`,
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

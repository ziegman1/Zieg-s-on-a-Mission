"use server";

import { revalidatePath } from "next/cache";
import { defaultSectionsForPage } from "@/lib/site-builder/defaults";
import {
  deletePageSections,
  loadPageSectionsForAdmin,
  savePageSections,
} from "@/lib/site-builder/sections-db";
import type { PageSection } from "@/lib/site-builder/types";
import { PAGE_REVALIDATE_PATHS } from "@/lib/site-builder/types";
import { requireAdminSession } from "@/lib/admin-auth";

async function revalidateForPage(pageKey: string) {
  const paths = PAGE_REVALIDATE_PATHS[pageKey] ?? [];
  for (const p of paths) {
    revalidatePath(p);
  }
  if (pageKey === "global") {
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
    console.error(e);
    return { ok: false as const, error: "Could not load page sections" };
  }
}

export async function saveBuilderPageAction(
  pageKey: string,
  sections: PageSection[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  try {
    await savePageSections(pageKey, sections);
    await revalidateForPage(pageKey);
    return { ok: true };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not save page sections" };
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

export async function publishAllBuilderPagesAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const keys = ["global", "home", "about", "mission", "partner", "give", "merch", "blog", "contact"];
  for (const key of keys) {
    await revalidateForPage(key);
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function clearBuilderPageCustomAction(pageKey: string) {
  const session = await requireAdminSession();
  if (!session) return { ok: false as const, error: "Unauthorized" };
  try {
    await deletePageSections(pageKey);
    await revalidateForPage(pageKey);
    return { ok: true as const, sections: defaultSectionsForPage(pageKey), hasCustom: false };
  } catch (e) {
    return { ok: false as const, error: "Could not clear custom sections" };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import {
  blocksFromStoredPayload,
  defaultBlocks,
  resetSectionToDefaults,
  toStoredPayload,
} from "@/lib/site-copy-blocks/payload";
import { siteCopyBlocksSaveSchema } from "@/lib/site-copy-blocks/schema";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";

const REVALIDATE_PATHS = [
  "/",
  "/about",
  "/mission",
  "/blog",
  "/contact",
  "/privacy",
  "/terms",
  "/shipping",
  "/returns",
  "/merch",
  "/partner",
  "/give",
  "/advocacy-team",
  "/community",
] as const;

async function revalidateStorefront() {
  for (const p of REVALIDATE_PATHS) {
    revalidatePath(p);
  }
  revalidatePath("/", "layout");
}

export async function saveSiteCopyBlocksAction(
  blocks: unknown,
): Promise<{ ok: true } | { ok: false; error: string; details?: unknown }> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const parsed = siteCopyBlocksSaveSchema.safeParse({
    version: 2,
    blocks,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Validation failed",
      details: parsed.error.flatten(),
    };
  }

  try {
    await prisma.siteCopy.upsert({
      where: { id: "default" },
      create: { id: "default", payload: toStoredPayload(parsed.data.blocks) as object },
      update: { payload: toStoredPayload(parsed.data.blocks) as object },
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not save to database. Is DATABASE_URL configured?" };
  }

  await revalidateStorefront();
  return { ok: true };
}

export async function loadSiteCopyBlocksAction(): Promise<
  { ok: true; blocks: ReturnType<typeof blocksFromStoredPayload> } | { ok: false; error: string }
> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  try {
    const row = await prisma.siteCopy.findUnique({ where: { id: "default" } });
    return { ok: true, blocks: blocksFromStoredPayload(row?.payload ?? {}) };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not load site copy." };
  }
}

export async function restoreAllSiteCopyDefaultsAction(): Promise<
  { ok: true; blocks: ReturnType<typeof defaultBlocks> } | { ok: false; error: string }
> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  return { ok: true, blocks: defaultBlocks() };
}

export async function resetSiteCopySectionAction(
  pageKey: string,
  sectionKey: string,
  currentBlocks: unknown,
): Promise<
  | { ok: true; blocks: ReturnType<typeof resetSectionToDefaults> }
  | { ok: false; error: string }
> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const parsed = siteCopyBlocksSaveSchema.safeParse({ version: 2, blocks: currentBlocks });
  if (!parsed.success) {
    return { ok: false, error: "Invalid block data" };
  }

  const blocks = resetSectionToDefaults(parsed.data.blocks, pageKey, sectionKey);
  return { ok: true, blocks };
}

/** @deprecated Legacy rigid save — prefer saveSiteCopyBlocksAction */
export async function saveSiteCopyAction(
  data: unknown,
): Promise<{ ok: true } | { ok: false; error: string; details?: unknown }> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const { siteCopySaveSchema } = await import("@/lib/site-copy-zod");
  const parsed = siteCopySaveSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: "Validation failed", details: parsed.error.flatten() };
  }

  const { siteCopyToBlocks } = await import("@/lib/site-copy-blocks/encode");
  const blocks = siteCopyToBlocks(parsed.data);
  return saveSiteCopyBlocksAction(blocks);
}

export async function resetSiteCopyToDefaultsAction(): Promise<
  { ok: true; blocks: ReturnType<typeof defaultBlocks> } | { ok: false; error: string }
> {
  return restoreAllSiteCopyDefaultsAction();
}

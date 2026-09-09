"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOnlySession } from "@/lib/admin-auth";
import {
  formatRecruitInputErrors,
  recruitInputSchema,
  recruitMilestoneSchema,
} from "@/lib/recruits/recruit-form";
import {
  createRecruit,
  deleteRecruit,
  renameRecruit,
  updateRecruitMilestones,
} from "@/lib/recruits/recruits-db";

export type RecruitActionResult = { ok: true } | { ok: false; error: string };

const UNAUTHORIZED = "Unauthorized — recruit records are ADMIN-only.";

function revalidateRecruits(): void {
  revalidatePath("/admin/recruits");
}

/**
 * Every action below independently calls requireAdminOnlySession(). The shared admin layout
 * admits STAFF, so these guards — not the layout — are what keep recruit data ADMIN-only.
 */
export async function createRecruitAction(input: { name: string }): Promise<RecruitActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };

  const parsed = recruitInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: formatRecruitInputErrors(parsed.error) };
  }

  try {
    await createRecruit(parsed.data.name);
  } catch (e) {
    console.error("[admin/recruits] create failed", e);
    return { ok: false, error: "Could not add that recruit." };
  }

  revalidateRecruits();
  return { ok: true };
}

export async function renameRecruitAction(
  id: string,
  input: { name: string },
): Promise<RecruitActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };

  if (!id) return { ok: false, error: "Missing recruit id." };

  const parsed = recruitInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: formatRecruitInputErrors(parsed.error) };
  }

  try {
    await renameRecruit(id, parsed.data.name);
  } catch (e) {
    console.error("[admin/recruits] rename failed", e);
    return { ok: false, error: "Could not rename that recruit." };
  }

  revalidateRecruits();
  return { ok: true };
}

export async function updateRecruitMilestonesAction(
  id: string,
  input: { jonathanTrainingComplete: boolean; fullyFunded: boolean },
): Promise<RecruitActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };

  if (!id) return { ok: false, error: "Missing recruit id." };

  const parsed = recruitMilestoneSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: formatRecruitInputErrors(parsed.error) };
  }

  try {
    await updateRecruitMilestones(id, parsed.data);
  } catch (e) {
    console.error("[admin/recruits] milestone update failed", e);
    return { ok: false, error: "Could not save that change." };
  }

  revalidateRecruits();
  return { ok: true };
}

export async function deleteRecruitAction(id: string): Promise<RecruitActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };

  if (!id) return { ok: false, error: "Missing recruit id." };

  try {
    await deleteRecruit(id);
  } catch (e) {
    console.error("[admin/recruits] delete failed", e);
    return { ok: false, error: "Could not delete that recruit." };
  }

  revalidateRecruits();
  return { ok: true };
}

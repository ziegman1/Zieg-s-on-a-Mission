"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOnlySession } from "@/lib/admin-auth";
import { importLegacyRecruitRoster, updateLegacyReview } from "@/lib/ministry/legacy-import-db";
import {
  leftoverTestRemovalError,
  legacyReviewSchema,
} from "@/lib/ministry/legacy-review";
import { deleteMinistryPerson } from "@/lib/ministry/ministry-db";

export type LegacyActionResult = { ok: true; message?: string } | { ok: false; error: string };

const UNAUTHORIZED = "Unauthorized — reconciliation records are ADMIN-only.";

function revalidate(): void {
  revalidatePath("/admin/recruits");
}

export async function importLegacyRosterAction(): Promise<LegacyActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };

  try {
    const result = await importLegacyRecruitRoster();
    revalidate();
    return {
      ok: true,
      message: `Import stored ${result.created} new people and left ${result.skipped} existing links unchanged.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not import the legacy roster.";
    console.error("[admin/legacy-import]", error);
    return { ok: false, error: message };
  }
}

export async function updateLegacyReviewAction(
  linkId: string,
  input: { reviewStatus: string; notes: string },
): Promise<LegacyActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };
  if (!linkId) return { ok: false, error: "Missing reconciliation id." };

  const parsed = legacyReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose a review status." };

  try {
    await updateLegacyReview(linkId, parsed.data, admin.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save that review.";
    return { ok: false, error: message };
  }

  revalidate();
  return { ok: true };
}

export async function removeLeftoverTestPersonAction(
  id: string,
  confirmation: string,
): Promise<LegacyActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };

  const refusal = leftoverTestRemovalError(id, confirmation);
  if (refusal) return { ok: false, error: refusal };

  try {
    await deleteMinistryPerson(id);
  } catch (error) {
    console.error("[admin/legacy-import] test cleanup failed", error);
    return { ok: false, error: "Could not remove that test record." };
  }

  revalidate();
  return { ok: true, message: "The leftover test record was removed." };
}

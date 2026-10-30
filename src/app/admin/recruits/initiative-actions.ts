"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOnlySession } from "@/lib/admin-auth";
import {
  createNationalPartnerInitiative,
  deleteNationalPartnerInitiative,
  updateNationalPartnerInitiative,
} from "@/lib/ministry/national-partner-initiatives-db";
import {
  formatNationalPartnerInitiativeErrors,
  nationalPartnerInitiativeCreateSchema,
  nationalPartnerInitiativeSchema,
} from "@/lib/ministry/national-partner-initiatives";

export type InitiativeActionResult = { ok: true } | { ok: false; error: string };

const UNAUTHORIZED = "Unauthorized — ministry records are ADMIN-only.";

function revalidateMinistry(): void {
  revalidatePath("/admin/recruits");
}

function friendlyInitiativeError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message === "That initiative no longer exists.") {
    return error.message;
  }
  console.error("[admin/ministry-initiatives]", error);
  return fallback;
}

export async function createNationalPartnerInitiativeAction(input: {
  nation: string;
  area: string;
  trainingType: string;
  completedCount: string;
  submissionKey: string;
}): Promise<InitiativeActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };
  const parsed = nationalPartnerInitiativeCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: formatNationalPartnerInitiativeErrors(parsed.error) };
  }
  try {
    await createNationalPartnerInitiative(parsed.data);
  } catch (error) {
    return { ok: false, error: friendlyInitiativeError(error, "Could not save that initiative.") };
  }
  revalidateMinistry();
  return { ok: true };
}

export async function updateNationalPartnerInitiativeAction(
  id: string,
  input: {
    nation: string;
    area: string;
    trainingType: string;
    completedCount: string;
  },
): Promise<InitiativeActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };
  if (!id) return { ok: false, error: "Missing initiative id." };
  const parsed = nationalPartnerInitiativeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: formatNationalPartnerInitiativeErrors(parsed.error) };
  }
  try {
    await updateNationalPartnerInitiative(id, parsed.data);
  } catch (error) {
    return { ok: false, error: friendlyInitiativeError(error, "Could not save that initiative.") };
  }
  revalidateMinistry();
  return { ok: true };
}

export async function deleteNationalPartnerInitiativeAction(
  id: string,
): Promise<InitiativeActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };
  if (!id) return { ok: false, error: "Missing initiative id." };
  try {
    await deleteNationalPartnerInitiative(id);
  } catch (error) {
    return { ok: false, error: friendlyInitiativeError(error, "Could not remove that initiative.") };
  }
  revalidateMinistry();
  return { ok: true };
}

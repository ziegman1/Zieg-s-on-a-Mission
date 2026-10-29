"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOnlySession } from "@/lib/admin-auth";
import {
  formatMinistryInputErrors,
  ministryActivitySchema,
  ministryMilestoneSchema,
  ministryPersonSchema,
} from "@/lib/ministry/ministry-form";
import {
  createMinistryActivity,
  createMinistryPerson,
  deleteMinistryActivity,
  deleteMinistryPerson,
  setMinistryHousehold,
  updateMinistryActivity,
  updateMinistryMilestones,
  updateMinistryPerson,
} from "@/lib/ministry/ministry-db";

export type MinistryActionResult = { ok: true } | { ok: false; error: string };

const UNAUTHORIZED = "Unauthorized — ministry records are ADMIN-only.";

function revalidateMinistry(): void {
  revalidatePath("/admin/recruits");
}

function friendlyConstraint(error: unknown, fallback: string): string {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "P2003") return "That legacy recruit record no longer exists.";
  if (code === "P2025") return "That record no longer exists.";
  console.error("[admin/ministry]", error);
  return fallback;
}

export async function createMinistryPersonAction(input: {
  displayName: string;
  pathway: string;
  notes: string;
}): Promise<MinistryActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };

  const parsed = ministryPersonSchema.safeParse({
    ...input,
    householdWithPersonId: "",
    legacyRecruitId: "",
  });
  if (!parsed.success) return { ok: false, error: formatMinistryInputErrors(parsed.error) };

  try {
    await createMinistryPerson({
      displayName: parsed.data.displayName,
      pathway: parsed.data.pathway,
      notes: parsed.data.notes,
    });
  } catch (error) {
    return { ok: false, error: friendlyConstraint(error, "Could not add that person.") };
  }

  revalidateMinistry();
  return { ok: true };
}

export async function updateMinistryPersonAction(
  id: string,
  input: {
    displayName: string;
    pathway: string;
    notes: string;
    householdWithPersonId: string;
    legacyRecruitId: string;
  },
): Promise<MinistryActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };
  if (!id) return { ok: false, error: "Missing person id." };

  const parsed = ministryPersonSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatMinistryInputErrors(parsed.error) };
  if (parsed.data.householdWithPersonId === id) {
    return { ok: false, error: "A person cannot be their own household." };
  }

  try {
    await updateMinistryPerson(id, {
      displayName: parsed.data.displayName,
      pathway: parsed.data.pathway,
      notes: parsed.data.notes,
      legacyRecruitId: parsed.data.legacyRecruitId,
    });
    await setMinistryHousehold(id, parsed.data.householdWithPersonId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("no longer exists")) return { ok: false, error: message };
    return { ok: false, error: friendlyConstraint(error, "Could not save that person.") };
  }

  revalidateMinistry();
  return { ok: true };
}

export async function updateMinistryMilestonesAction(
  id: string,
  input: {
    mobilized: boolean;
    mobilizedOn: string;
    trainedEquipped: boolean;
    trainedEquippedOn: string;
    sent: boolean;
    sentOn: string;
    sentDesignation: string;
    sentVerifiedBy: string;
    sentVerificationNote: string;
  },
): Promise<MinistryActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };
  if (!id) return { ok: false, error: "Missing person id." };

  const parsed = ministryMilestoneSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatMinistryInputErrors(parsed.error) };

  try {
    await updateMinistryMilestones(id, parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("no longer exists")) return { ok: false, error: message };
    return { ok: false, error: friendlyConstraint(error, "Could not save those milestones.") };
  }

  revalidateMinistry();
  return { ok: true };
}

export async function deleteMinistryPersonAction(id: string): Promise<MinistryActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };
  if (!id) return { ok: false, error: "Missing person id." };

  try {
    await deleteMinistryPerson(id);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "P2003") {
      return {
        ok: false,
        error: "This person is part of the legacy reconciliation, so the record was kept.",
      };
    }
    return { ok: false, error: friendlyConstraint(error, "Could not delete that person.") };
  }

  revalidateMinistry();
  return { ok: true };
}

export async function createMinistryActivityAction(
  personId: string,
  input: {
    activityType: string;
    status: string;
    activityOn: string;
    location: string;
    notes: string;
  },
): Promise<MinistryActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };
  if (!personId) return { ok: false, error: "Missing person id." };

  const parsed = ministryActivitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatMinistryInputErrors(parsed.error) };

  try {
    await createMinistryActivity(personId, parsed.data);
  } catch (error) {
    return { ok: false, error: friendlyConstraint(error, "Could not add that activity.") };
  }

  revalidateMinistry();
  return { ok: true };
}

export async function updateMinistryActivityAction(
  id: string,
  input: {
    activityType: string;
    status: string;
    activityOn: string;
    location: string;
    notes: string;
  },
): Promise<MinistryActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };
  if (!id) return { ok: false, error: "Missing activity id." };

  const parsed = ministryActivitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatMinistryInputErrors(parsed.error) };

  try {
    await updateMinistryActivity(id, parsed.data);
  } catch (error) {
    return { ok: false, error: friendlyConstraint(error, "Could not save that activity.") };
  }

  revalidateMinistry();
  return { ok: true };
}

export async function deleteMinistryActivityAction(id: string): Promise<MinistryActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };
  if (!id) return { ok: false, error: "Missing activity id." };

  try {
    await deleteMinistryActivity(id);
  } catch (error) {
    return { ok: false, error: friendlyConstraint(error, "Could not delete that activity.") };
  }

  revalidateMinistry();
  return { ok: true };
}

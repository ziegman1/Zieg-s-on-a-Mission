"use server";

import { revalidatePath } from "next/cache";
import { requireAdminOnlySession } from "@/lib/admin-auth";
import {
  formatActivityInputErrors,
  formatMinistryInputErrors,
  ministryActivitySchema,
  ministryMilestoneSchema,
  ministryPersonSaveSchema,
  ministryPersonSchema,
} from "@/lib/ministry/ministry-form";
import {
  createMinistryActivity,
  createMinistryPerson,
  deleteMinistryActivity,
  deleteMinistryPerson,
  getMinistryPerson,
  saveMinistryPersonChanges,
  setMinistryHousehold,
  updateMinistryActivity,
  updateMinistryMilestones,
  updateMinistryPerson,
} from "@/lib/ministry/ministry-db";
import { MinistrySaveRejected, resolveMinistryPersonSave } from "@/lib/ministry/ministry-save";

export type MinistryActionResult =
  | { ok: true }
  | { ok: false; error: string; needsConfirmation?: boolean };

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

export async function saveMinistryPersonAction(
  id: string,
  input: {
    displayName: string;
    pathway: string;
    notes: string;
    householdWithPersonId: string;
    legacyRecruitId: string;
    jonathanTrainingComplete: boolean;
    fullyFunded: boolean;
    confirmHistoryChange: boolean;
    mobilized: boolean;
    mobilizedOn: string;
    trainedEquipped: boolean;
    trainedEquippedOn: string;
    sent: boolean;
    sentOn: string;
    sentDesignation: string;
    sentVerifiedBy: string;
    sentVerificationNote: string;
    activityCreate?: {
      activityType: string;
      status: string;
      activityOn: string;
      location: string;
      notes: string;
    } | null;
    activityUpdate?: {
      id: string;
      activityType: string;
      status: string;
      activityOn: string;
      location: string;
      notes: string;
    } | null;
    activityDeleteIds?: string[];
  },
): Promise<MinistryActionResult> {
  const admin = await requireAdminOnlySession();
  if (!admin) return { ok: false, error: UNAUTHORIZED };
  if (!id) return { ok: false, error: "Missing person id." };

  const parsed = ministryPersonSaveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: formatMinistryInputErrors(parsed.error) };
  if (parsed.data.householdWithPersonId === id) {
    return { ok: false, error: "A person cannot be their own household." };
  }

  let activityCreate: {
    activityType: "JONATHAN_TRAINING" | "MEDICAL_TRAINING" | "SUPPORT_RAISING_COACHING" | "D_COURSE" | "ZUME" | "FOUR_FIELDS_ONLINE" | "FIDELIS" | "OTHER";
    status: "PARTICIPATED" | "COMPLETED";
    activityOn: string | null;
    location: string;
    notes: string;
  } | null = null;
  if (input.activityCreate) {
    const parsedActivity = ministryActivitySchema.safeParse(input.activityCreate);
    if (!parsedActivity.success) {
      return { ok: false, error: formatActivityInputErrors(parsedActivity.error) };
    }
    activityCreate = parsedActivity.data;
  }
  let activityUpdate: {
    id: string;
    activityType: "JONATHAN_TRAINING" | "MEDICAL_TRAINING" | "SUPPORT_RAISING_COACHING" | "D_COURSE" | "ZUME" | "FOUR_FIELDS_ONLINE" | "FIDELIS" | "OTHER";
    status: "PARTICIPATED" | "COMPLETED";
    activityOn: string | null;
    location: string;
    notes: string;
  } | null = null;
  if (input.activityUpdate) {
    const parsedActivity = ministryActivitySchema.safeParse(input.activityUpdate);
    if (!parsedActivity.success) {
      return { ok: false, error: formatActivityInputErrors(parsedActivity.error) };
    }
    activityUpdate = { id: input.activityUpdate.id, ...parsedActivity.data };
  }
  const activityDeleteIds = input.activityDeleteIds ?? [];

  const existing = await getMinistryPerson(id);
  if (!existing) return { ok: false, error: "That person no longer exists." };

  const recordedOn = new Date().toISOString().slice(0, 10);
  const submission = {
    pathway: parsed.data.pathway,
    jonathanTrainingComplete: parsed.data.jonathanTrainingComplete,
    fullyFunded: parsed.data.fullyFunded,
    mobilized: parsed.data.mobilized,
    mobilizedOn: parsed.data.mobilizedOn,
    trainedEquipped: parsed.data.trainedEquipped,
    trainedEquippedOn: parsed.data.trainedEquippedOn,
    sent: parsed.data.sent,
    sentOn: parsed.data.sentOn,
    sentDesignation: parsed.data.sentDesignation,
    sentVerifiedBy: parsed.data.sentVerifiedBy,
    sentVerificationNote: parsed.data.sentVerificationNote,
    confirmHistoryChange: parsed.data.confirmHistoryChange,
  };
  const resolved = resolveMinistryPersonSave(
    {
      mobilized: existing.mobilized,
      mobilizedOn: existing.mobilizedOn,
      trainedEquipped: existing.trainedEquipped,
      trainedEquippedOn: existing.trainedEquippedOn,
      sent: existing.sent,
      sentOn: existing.sentOn,
      sentDesignation: existing.sentDesignation,
      sentVerifiedAt: existing.sentVerifiedAt,
      sentVerifiedBy: existing.sentVerifiedBy,
      sentVerificationNote: existing.sentVerificationNote,
      milestoneAudit: existing.milestoneAudit,
    },
    submission,
    recordedOn,
  );
  if (!resolved.ok) {
    return { ok: false, error: resolved.error, needsConfirmation: resolved.needsConfirmation };
  }

  try {
    await saveMinistryPersonChanges(id, {
      displayName: parsed.data.displayName,
      pathway: parsed.data.pathway,
      notes: parsed.data.notes,
      legacyRecruitId: parsed.data.legacyRecruitId,
      householdWithPersonId: parsed.data.householdWithPersonId,
      submission,
      recordedOn,
      activities: {
        create: activityCreate,
        update: activityUpdate,
        deleteIds: activityDeleteIds,
      },
    });
  } catch (error) {
    if (error instanceof MinistrySaveRejected) {
      return { ok: false, error: error.message, needsConfirmation: error.needsConfirmation };
    }
    const message = error instanceof Error ? error.message : "";
    if (message.includes("no longer exists") || message.includes("own household")) {
      return { ok: false, error: message };
    }
    return { ok: false, error: friendlyConstraint(error, "Could not save that person.") };
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

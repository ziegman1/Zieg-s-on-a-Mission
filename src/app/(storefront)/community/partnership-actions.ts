"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { isCommunityMemberRole } from "@/lib/auth-roles";
import { isAdminRole } from "@/lib/admin-users";
import {
  PARTNERSHIP_PREF_KEYS,
  partnershipPreferencesFromSelection,
  type PartnershipPrefKey,
} from "@/lib/community/partnership-preferences";
import { saveUserPartnershipPreferences } from "@/lib/community/user-partnership-prefs";
import { getCurrentCommunityMember } from "@/lib/community/members";

const partnershipSelectionSchema = z.object({
  ministryUpdates: z.boolean(),
  newsletters: z.boolean(),
  prayerTeam: z.boolean(),
  urgentPrayerRequests: z.boolean(),
  advocacyInterest: z.boolean(),
  financialPartnership: z.boolean(),
});

export type PartnershipSelectionInput = z.infer<typeof partnershipSelectionSchema>;

async function requirePartnershipUser(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in to save your partnership preferences" };
  }
  const member = await getCurrentCommunityMember();
  const role = session.user.role;
  if (
    !member &&
    !isCommunityMemberRole(role) &&
    !isAdminRole(role)
  ) {
    return { ok: false, error: "Mission Hub membership required" };
  }
  return { ok: true, userId: session.user.id };
}

export async function savePartnershipPreferencesAction(
  input: PartnershipSelectionInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const authResult = await requirePartnershipUser();
  if (!authResult.ok) return authResult;

  const parsed = partnershipSelectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid partnership preferences" };
  }

  const prefs = partnershipPreferencesFromSelection(parsed.data, true);

  try {
    await saveUserPartnershipPreferences(authResult.userId, prefs);
  } catch (e) {
    console.error("[savePartnershipPreferences]", e);
    return { ok: false, error: "Could not save preferences" };
  }

  revalidatePath("/community", "layout");
  revalidatePath("/community/settings");
  return { ok: true };
}

export function partnershipSelectionFromFormData(
  formData: FormData,
): PartnershipSelectionInput {
  const selection = {} as Record<PartnershipPrefKey, boolean>;
  for (const key of PARTNERSHIP_PREF_KEYS) {
    selection[key] = formData.get(key) === "on" || formData.get(key) === "true";
  }
  return selection as PartnershipSelectionInput;
}

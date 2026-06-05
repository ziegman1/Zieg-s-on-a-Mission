"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { isCommunityMemberRole } from "@/lib/auth-roles";
import { isAdminRole } from "@/lib/admin-users";
import { getWelcomePostPathForIntro } from "@/lib/community/hub-settings";
import {
  needsPartnershipOnboarding,
  partnershipPreferencesFromSelection,
} from "@/lib/community/partnership-preferences";
import {
  buildWelcomeIntroRedirectUrl,
  shouldRedirectToWelcomeIntro,
} from "@/lib/community/welcome-intro";
import {
  getUserPartnershipPreferences,
  saveUserPartnershipPreferences,
} from "@/lib/community/user-partnership-prefs";
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

export type SavePartnershipPreferencesResult =
  | { ok: true; redirectTo: string | null }
  | { ok: false; error: string };

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
  options?: { authCallbackUrl?: string | null },
): Promise<SavePartnershipPreferencesResult> {
  const authResult = await requirePartnershipUser();
  if (!authResult.ok) return authResult;

  const parsed = partnershipSelectionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid partnership preferences" };
  }

  const existing = await getUserPartnershipPreferences(authResult.userId);
  const wasOnboardingPending = needsPartnershipOnboarding(existing);

  const runWelcomeRedirect = shouldRedirectToWelcomeIntro({
    welcomeIntroCompleted: existing?.welcomeIntroCompleted ?? false,
    wasOnboardingPending,
    authCallbackUrl: options?.authCallbackUrl,
  });

  const prefs = partnershipPreferencesFromSelection(parsed.data, true, {
    welcomeIntroCompleted: runWelcomeRedirect
      ? true
      : (existing?.welcomeIntroCompleted ?? false),
  });

  try {
    await saveUserPartnershipPreferences(authResult.userId, prefs);
  } catch (e) {
    console.error("[savePartnershipPreferences]", e);
    return { ok: false, error: "Could not save preferences" };
  }

  revalidatePath("/community", "layout");
  revalidatePath("/community/settings");

  if (!runWelcomeRedirect) {
    return { ok: true, redirectTo: null };
  }

  try {
    const welcomePath = await getWelcomePostPathForIntro();
    return { ok: true, redirectTo: buildWelcomeIntroRedirectUrl(welcomePath) };
  } catch (e) {
    console.error("[savePartnershipPreferences] welcome path:", e);
    return { ok: true, redirectTo: null };
  }
}

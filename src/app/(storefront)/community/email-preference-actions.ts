"use server";

import { revalidatePath } from "next/cache";
import type { NotificationPreferences } from "@/lib/community/settings-types";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import {
  saveMissionHubEmailPreferences,
  unsubscribeMissionHubEmail,
} from "@/lib/mission-hub/mission-hub-email-preferences";
import { verifyEmailPreferenceToken } from "@/lib/mission-hub/email-preference-tokens";

export type TokenPreferencePageData =
  | {
      ok: true;
      email: string;
      prefs: NotificationPreferences;
    }
  | { ok: false; error: string };

export async function loadEmailPreferencesByToken(
  token: string,
): Promise<TokenPreferencePageData> {
  const payload = verifyEmailPreferenceToken(token, "preferences");
  if (!payload) return { ok: false, error: "This preferences link is invalid or expired." };

  const prefs = await getUserNotificationPreferences(payload.userId);
  return { ok: true, email: payload.email, prefs };
}

export async function saveEmailPreferencesByTokenAction(input: {
  token: string;
  email: boolean;
  categoryFrequencies: NotificationPreferences["categoryFrequencies"];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const payload = verifyEmailPreferenceToken(input.token, "preferences");
  if (!payload) return { ok: false, error: "This preferences link is invalid or expired." };

  try {
    await saveMissionHubEmailPreferences({
      userId: payload.userId,
      email: payload.email,
      prefs: {
        email: input.email,
        inApp: true,
        categoryFrequencies: input.categoryFrequencies,
        mutedSpaceIds: [],
      },
    });
    revalidatePath("/community/email-preferences");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not save preferences" };
  }
}

export async function unsubscribeByTokenAction(
  token: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const payload = verifyEmailPreferenceToken(token, "unsubscribe");
  if (!payload) return { ok: false, error: "This unsubscribe link is invalid or expired." };

  try {
    await unsubscribeMissionHubEmail({
      userId: payload.userId,
      email: payload.email,
    });
    revalidatePath("/community/unsubscribe");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not unsubscribe" };
  }
}

/** GET unsubscribe via token query param — one-click from email clients. */
export async function processUnsubscribeToken(
  token: string,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const payload = verifyEmailPreferenceToken(token, "unsubscribe");
  if (!payload) return { ok: false, error: "This unsubscribe link is invalid or expired." };

  await unsubscribeMissionHubEmail({
    userId: payload.userId,
    email: payload.email,
  });

  return { ok: true, email: payload.email };
}

export async function loadUnsubscribeLanding(token?: string) {
  if (!token) {
    return { ok: false as const, error: "Missing unsubscribe token." };
  }
  return processUnsubscribeToken(token);
}

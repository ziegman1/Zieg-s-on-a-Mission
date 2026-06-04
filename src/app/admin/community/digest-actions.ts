"use server";

import { requireCommunityOwner } from "@/lib/community/owner";
import { deliverWeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest-delivery";
import {
  prepareWeeklyMissionHubDigest,
  type WeeklyMissionHubDigest,
} from "@/lib/mission-hub/weekly-digest";
import type { WeeklyDigestDeliveryResult } from "@/lib/mission-hub/weekly-digest-delivery";

type DigestWindowInput = {
  startIso?: string;
  endIso?: string;
};

function parseWindow(input?: DigestWindowInput) {
  return {
    start: input?.startIso ? new Date(input.startIso) : undefined,
    end: input?.endIso ? new Date(input.endIso) : undefined,
  };
}

export async function previewWeeklyMissionHubDigestAction(input?: DigestWindowInput): Promise<
  | { ok: true; digest: WeeklyMissionHubDigest }
  | { ok: false; error: string }
> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  try {
    const digest = await prepareWeeklyMissionHubDigest(parseWindow(input));
    return { ok: true, digest };
  } catch (e) {
    console.error("[weekly-digest] preview failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not generate digest preview",
    };
  }
}

export type WeeklyDigestSendActionResult =
  | { ok: true; delivery: WeeklyDigestDeliveryResult }
  | { ok: false; error: string };

export async function sendWeeklyDigestTestToMeAction(
  input?: DigestWindowInput,
): Promise<WeeklyDigestSendActionResult> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  const email = owner.email?.trim();
  if (!email) {
    return { ok: false, error: "Your admin account does not have an email address on file." };
  }

  try {
    const delivery = await deliverWeeklyMissionHubDigest({
      window: parseWindow(input),
      testRecipient: { userId: owner.id, email },
    });

    if (!delivery.emailEnabled) {
      return {
        ok: false,
        error: delivery.emailDisabledReason ?? "Mission Hub email delivery is disabled.",
      };
    }

    if (delivery.sent === 0 && delivery.failed > 0) {
      return {
        ok: false,
        error: delivery.errors[0] ?? "Test email could not be sent.",
      };
    }

    return { ok: true, delivery };
  } catch (e) {
    console.error("[weekly-digest] test send failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not send test digest email",
    };
  }
}

export async function sendWeeklyDigestToMembersAction(
  input?: DigestWindowInput & { forceResend?: boolean },
): Promise<WeeklyDigestSendActionResult> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  try {
    const delivery = await deliverWeeklyMissionHubDigest({
      window: parseWindow(input),
      broadcastToMembers: true,
      forceResend: input?.forceResend === true,
    });

    if (!delivery.emailEnabled) {
      return {
        ok: false,
        error: delivery.emailDisabledReason ?? "Mission Hub email delivery is disabled.",
      };
    }

    if (!delivery.digest.hasContent) {
      return {
        ok: false,
        error: "This digest has no content — member send is disabled. Use test send to preview an empty week.",
      };
    }

    return { ok: true, delivery };
  } catch (e) {
    console.error("[weekly-digest] member send failed:", e);
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not send weekly digest to members",
    };
  }
}

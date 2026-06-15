"use server";

import { revalidatePath } from "next/cache";
import { CAMPAIGN_ROUTES } from "@/data/support-campaign-config";
import { requireAdminSession } from "@/lib/admin-auth";
import {
  recordSupportCampaignPledgeIntent,
  updateSupportCampaignPledgedAmount,
} from "@/lib/support-campaign/campaign-state";

export async function updateCampaignPledgedAmountAction(
  pledgedAmount: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdminSession();
  if (!admin) return { ok: false, error: "Admin access required." };

  if (!Number.isFinite(pledgedAmount) || pledgedAmount < 0) {
    return { ok: false, error: "Enter a valid monthly pledged total." };
  }

  try {
    await updateSupportCampaignPledgedAmount(pledgedAmount);
    revalidatePath(CAMPAIGN_ROUTES.primary);
    revalidatePath(CAMPAIGN_ROUTES.alias);
    return { ok: true };
  } catch (e) {
    console.error("[updateCampaignPledgedAmountAction]", e);
    return { ok: false, error: "Could not save campaign total." };
  }
}

/** Logs a card click for admin review — does not change the public meter. */
export async function recordCampaignPledgeIntentAction(
  amount: number,
): Promise<void> {
  try {
    await recordSupportCampaignPledgeIntent({ amount });
  } catch (e) {
    console.error("[recordCampaignPledgeIntentAction]", e);
  }
}

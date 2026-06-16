"use server";

import { revalidatePath } from "next/cache";
import {
  CAMPAIGN_ROUTES,
  PARTNERSHIP_LEVELS,
  type PartnershipLevel,
} from "@/data/support-campaign-config";
import { addSupportCampaignPledge } from "@/lib/support-campaign/campaign-state";

export type AddCampaignPledgeResult =
  | { ok: true; pledgedAmount: number }
  | { ok: false; error: string };

/** Adds a partnership-card amount to the shared campaign total. */
export async function addCampaignPledgeAction(
  amount: number,
): Promise<AddCampaignPledgeResult> {
  if (!PARTNERSHIP_LEVELS.includes(amount as PartnershipLevel)) {
    return { ok: false, error: "Invalid partnership level." };
  }

  try {
    const state = await addSupportCampaignPledge(amount);
    revalidatePath(CAMPAIGN_ROUTES.primary);
    revalidatePath(CAMPAIGN_ROUTES.alias);
    return { ok: true, pledgedAmount: state.pledgedAmount };
  } catch (e) {
    console.error("[addCampaignPledgeAction]", e);
    return {
      ok: false,
      error: "Could not record your pledge selection. Please try again.",
    };
  }
}

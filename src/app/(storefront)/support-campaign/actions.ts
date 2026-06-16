"use server";

import { revalidatePath } from "next/cache";
import {
  CAMPAIGN_ROUTES,
  PARTNERSHIP_LEVELS,
  type PartnershipLevel,
} from "@/data/support-campaign-config";
import { addSupportCampaignPledge } from "@/lib/support-campaign/campaign-state";

/** Adds a partnership-card amount to the shared campaign total. */
export async function addCampaignPledgeAction(amount: number): Promise<void> {
  if (!PARTNERSHIP_LEVELS.includes(amount as PartnershipLevel)) return;

  try {
    await addSupportCampaignPledge(amount);
    revalidatePath(CAMPAIGN_ROUTES.primary);
    revalidatePath(CAMPAIGN_ROUTES.alias);
  } catch (e) {
    console.error("[addCampaignPledgeAction]", e);
  }
}

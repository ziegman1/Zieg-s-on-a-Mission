"use server";

import { revalidatePath } from "next/cache";
import { CAMPAIGN_ROUTES } from "@/data/support-campaign-config";
import { requireAdminSession } from "@/lib/admin-auth";
import { updateSupportCampaignPledgedAmount } from "@/lib/support-campaign/campaign-state";

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
    revalidatePath("/admin/support-campaign");
    return { ok: true };
  } catch (e) {
    console.error("[updateCampaignPledgedAmountAction]", e);
    return { ok: false, error: "Could not save campaign total." };
  }
}

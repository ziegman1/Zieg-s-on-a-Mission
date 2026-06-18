import type { AddCampaignPledgeResult } from "@/app/(storefront)/support-campaign/actions";

export type PledgeClickFlowDeps = {
  addPledge: (amount: number) => Promise<AddCampaignPledgeResult>;
  openGivingPage: () => void;
  /** Called after a successful pledge, before redirect. */
  onRecorded?: (pledgedAmount: number) => void | Promise<void>;
};

export async function runSupportCampaignPledgeClick(
  amount: number,
  deps: PledgeClickFlowDeps,
): Promise<AddCampaignPledgeResult> {
  const result = await deps.addPledge(amount);
  if (!result.ok) return result;

  await deps.onRecorded?.(result.pledgedAmount);
  deps.openGivingPage();
  return result;
}

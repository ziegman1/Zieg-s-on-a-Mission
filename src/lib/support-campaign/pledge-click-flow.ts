import type { AddCampaignPledgeResult } from "@/app/(storefront)/support-campaign/actions";

export type PledgeClickFlowDeps = {
  addPledge: (amount: number) => Promise<AddCampaignPledgeResult>;
  refresh: () => void;
  openGivingPage: () => void;
  /** Called after a successful pledge, before refresh/delay/open. */
  onRecorded?: (pledgedAmount: number) => void | Promise<void>;
  /** Pause before opening Aplos so the thank-you message is visible. */
  delayMs?: number;
};

export async function runSupportCampaignPledgeClick(
  amount: number,
  deps: PledgeClickFlowDeps,
): Promise<AddCampaignPledgeResult> {
  const result = await deps.addPledge(amount);
  if (!result.ok) return result;

  await deps.onRecorded?.(result.pledgedAmount);
  deps.refresh();

  const delay = deps.delayMs ?? 0;
  if (delay > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, delay);
    });
  }

  deps.openGivingPage();
  return result;
}

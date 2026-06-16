import type { Metadata } from "next";
import { SupportCampaignPage } from "@/components/support-campaign/support-campaign-page";
import { CAMPAIGN_COPY } from "@/data/support-campaign-config";
import { getSupportCampaignState } from "@/lib/support-campaign/campaign-state";

/** Temporary campaign landing page — safe to delete when the campaign ends. */
export const metadata: Metadata = {
  title: CAMPAIGN_COPY.metaTitle,
  description: CAMPAIGN_COPY.metaDescription,
};

export default async function SupportCampaignRoutePage() {
  const campaignState = await getSupportCampaignState();

  return <SupportCampaignPage campaignState={campaignState} />;
}

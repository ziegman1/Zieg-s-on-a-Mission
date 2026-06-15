import type { Metadata } from "next";
import { SupportCampaignPage } from "@/components/support-campaign/support-campaign-page";
import { CAMPAIGN_COPY } from "@/data/support-campaign-config";

/** Temporary campaign landing page — safe to delete when the campaign ends. */
export const metadata: Metadata = {
  title: CAMPAIGN_COPY.metaTitle,
  description: CAMPAIGN_COPY.metaDescription,
};

export default function SupportCampaignRoutePage() {
  return <SupportCampaignPage />;
}

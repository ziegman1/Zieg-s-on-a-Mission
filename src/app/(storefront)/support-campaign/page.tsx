import type { Metadata } from "next";
import { auth } from "@/auth";
import { SupportCampaignPage } from "@/components/support-campaign/support-campaign-page";
import { CAMPAIGN_COPY } from "@/data/support-campaign-config";
import { isAdminRole } from "@/lib/admin-users";
import { getSupportCampaignState } from "@/lib/support-campaign/campaign-state";

/** Temporary campaign landing page — safe to delete when the campaign ends. */
export const metadata: Metadata = {
  title: CAMPAIGN_COPY.metaTitle,
  description: CAMPAIGN_COPY.metaDescription,
};

export default async function SupportCampaignRoutePage() {
  const [session, campaignState] = await Promise.all([auth(), getSupportCampaignState()]);
  const isSiteAdmin = isAdminRole(session?.user?.role);

  return <SupportCampaignPage isSiteAdmin={isSiteAdmin} campaignState={campaignState} />;
}

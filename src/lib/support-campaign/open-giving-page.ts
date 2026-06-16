import { CAMPAIGN_GIVING_URL } from "@/data/support-campaign-config";

export function openCampaignGivingPage(): void {
  window.open(CAMPAIGN_GIVING_URL, "_blank", "noopener,noreferrer");
}

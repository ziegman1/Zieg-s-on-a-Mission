import { CAMPAIGN_GIVING_URL } from "@/data/support-campaign-config";

/** Navigate the current tab to Aplos after pledge recording (reliable on mobile Safari). */
export function openCampaignGivingPage(): void {
  window.location.assign(CAMPAIGN_GIVING_URL);
}

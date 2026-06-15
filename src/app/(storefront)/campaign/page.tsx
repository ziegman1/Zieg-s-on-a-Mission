import { redirect } from "next/navigation";
import { CAMPAIGN_ROUTES } from "@/data/support-campaign-config";

/** Alias route — redirects to the primary temporary campaign page. */
export default function CampaignAliasPage() {
  redirect(CAMPAIGN_ROUTES.primary);
}

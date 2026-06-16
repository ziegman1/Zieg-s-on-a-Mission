import Link from "next/link";
import { SupportCampaignAdminManager } from "@/components/admin/support-campaign-admin-manager";
import { Button } from "@/components/ui/button";
import { CAMPAIGN_ROUTES } from "@/data/support-campaign-config";
import {
  getSupportCampaignState,
  listRecentSupportCampaignPledgeIntents,
} from "@/lib/support-campaign/campaign-state";

export const dynamic = "force-dynamic";

export default async function AdminSupportCampaignPage() {
  const [campaignState, recentIntents] = await Promise.all([
    getSupportCampaignState(),
    listRecentSupportCampaignPledgeIntents(50),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-brand-primary tracking-wide">Support campaign</h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl leading-relaxed">
            Manage the shared pledge total for the public campaign page. Partnership-card clicks
            increment this total automatically; use this page to correct accidental clicks.
          </p>
        </div>
        <Button asChild variant="outline" className="border-brand-primary/50 text-brand-primary">
          <Link href={CAMPAIGN_ROUTES.primary} target="_blank" rel="noopener noreferrer">
            View public page
          </Link>
        </Button>
      </div>

      <SupportCampaignAdminManager
        goalAmount={campaignState.goalAmount}
        pledgedAmount={campaignState.pledgedAmount}
        recentIntents={recentIntents}
      />
    </div>
  );
}

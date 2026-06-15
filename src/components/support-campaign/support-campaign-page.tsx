"use client";

import { useCallback, useState } from "react";
import { recordCampaignPledgeIntentAction } from "@/app/(storefront)/support-campaign/actions";
import { Button } from "@/components/ui/button";
import {
  CAMPAIGN_COPY,
  CAMPAIGN_GIVING_URL,
  type PartnershipLevel,
} from "@/data/support-campaign-config";
import type { SupportCampaignState } from "@/lib/support-campaign/campaign-state";
import { isCampaignActive } from "@/lib/support-campaign/campaign-countdown";
import { SupportCampaignAdminPanel } from "./support-campaign-admin-panel";
import { SupportCampaignCountdown } from "./support-campaign-countdown";
import { SupportCampaignMeter } from "./support-campaign-meter";
import { SupportCampaignPledgeCards } from "./support-campaign-pledge-cards";

function openGivingPage(): void {
  window.open(CAMPAIGN_GIVING_URL, "_blank", "noopener,noreferrer");
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-xl sm:text-2xl text-brand-primary tracking-wide text-center">
      {children}
    </h2>
  );
}

export function SupportCampaignPage({
  isSiteAdmin = false,
  campaignState,
}: {
  isSiteAdmin?: boolean;
  campaignState: SupportCampaignState;
}) {
  const [campaignActive, setCampaignActive] = useState(isCampaignActive);

  const handleSelectLevel = useCallback((amount: PartnershipLevel) => {
    void recordCampaignPledgeIntentAction(amount);
    openGivingPage();
  }, []);

  return (
    <div className="bg-brand-surface text-brand-ink">
      {/* A. Hero */}
      <section className="border-b border-brand-primary/20 bg-gradient-to-b from-white/60 to-brand-surface px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-4xl lg:max-w-5xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">
            {CAMPAIGN_COPY.heroEyebrow}
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl md:text-[2.5rem] text-brand-ink tracking-wide leading-tight">
            {CAMPAIGN_COPY.heroHeadline}
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-lg sm:text-xl text-brand-ink leading-relaxed font-medium">
            {CAMPAIGN_COPY.heroVision}
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-base text-brand-ink/80 leading-relaxed">
            {campaignActive
              ? CAMPAIGN_COPY.heroCampaignNote
              : CAMPAIGN_COPY.heroCampaignNoteExpired}
          </p>
          <div className="mx-auto mt-4 max-w-3xl">
            <SupportCampaignCountdown onActiveChange={setCampaignActive} />
          </div>
          <div className="mx-auto mt-4 max-w-3xl">
            <SupportCampaignMeter
              pledgedAmount={campaignState.pledgedAmount}
              goalAmount={campaignState.goalAmount}
              variant="compact"
            />
          </div>
        </div>
      </section>

      {/* B. Partnership levels */}
      <section id="pledge" className="px-4 py-8 sm:py-10 scroll-mt-20">
        <div className="mx-auto max-w-5xl">
          <SectionHeading>{CAMPAIGN_COPY.partnershipHeading}</SectionHeading>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-brand-ink/75 leading-relaxed">
            {campaignActive
              ? CAMPAIGN_COPY.partnershipIntro
              : CAMPAIGN_COPY.partnershipIntroExpired}
          </p>
          <div className="mt-6">
            <SupportCampaignPledgeCards onSelectLevel={handleSelectLevel} />
          </div>
          {isSiteAdmin ? (
            <SupportCampaignAdminPanel
              pledgedAmount={campaignState.pledgedAmount}
              goalAmount={campaignState.goalAmount}
            />
          ) : null}
        </div>
      </section>

      {/* C. Why this matters */}
      <section className="border-t border-brand-primary/10 bg-white/40 px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <SectionHeading>{CAMPAIGN_COPY.heartbeatHeading}</SectionHeading>
          <div className="mt-4 space-y-3 text-brand-ink/88 leading-relaxed text-center sm:text-left">
            <p className="font-medium text-brand-ink">{CAMPAIGN_COPY.heartbeatLead}</p>
            <p>{CAMPAIGN_COPY.heartbeatBody}</p>
          </div>
        </div>
      </section>

      {/* D. Ministry impact / vision */}
      <section className="px-4 py-8 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <SectionHeading>{CAMPAIGN_COPY.impactHeading}</SectionHeading>
          <div className="mt-4 space-y-3 text-brand-ink/88 leading-relaxed text-center sm:text-left">
            <p className="font-medium text-brand-ink">{CAMPAIGN_COPY.impactVision}</p>
            <p>{CAMPAIGN_COPY.impactPartnership}</p>
          </div>
        </div>
      </section>

      {/* E. Final giving */}
      <section className="border-t border-brand-primary/20 bg-brand-primary/10 px-4 py-10 sm:py-12">
        <div className="mx-auto max-w-xl text-center">
          <Button
            asChild
            className="rounded-full px-10 h-12 bg-brand-accent text-brand-ink hover:bg-brand-accent/90 font-semibold shadow-md text-base"
          >
            <a href={CAMPAIGN_GIVING_URL} target="_blank" rel="noopener noreferrer">
              {CAMPAIGN_COPY.finalGivingCta}
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

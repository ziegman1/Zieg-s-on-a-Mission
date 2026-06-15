"use client";

import { Check } from "lucide-react";
import {
  PARTNERSHIP_LEVELS,
  type PartnershipLevel,
} from "@/data/support-campaign-config";
import { hasPledgedAmount } from "@/lib/support-campaign/pledge-storage";
import { cn } from "@/lib/utils";

function formatMonthly(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SupportCampaignPledgeCards({
  pledges,
  addAnotherMode,
  campaignActive,
  onSelectLevel,
}: {
  pledges: number[];
  addAnotherMode: boolean;
  campaignActive: boolean;
  onSelectLevel: (amount: PartnershipLevel) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PARTNERSHIP_LEVELS.map((amount) => {
        const alreadyPledged = campaignActive && hasPledgedAmount(pledges, amount);
        const willAdd = campaignActive && (addAnotherMode || !alreadyPledged);

        return (
          <button
            key={amount}
            type="button"
            onClick={() => onSelectLevel(amount)}
            className={cn(
              "group relative flex flex-col items-start rounded-xl border px-5 py-6 text-left transition-all",
              "border-brand-primary/20 bg-brand-surface/90 shadow-sm hover:border-brand-primary/45 hover:shadow-md",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40",
              alreadyPledged && !addAnotherMode && "ring-1 ring-brand-primary/25",
            )}
          >
            {alreadyPledged ? (
              <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary">
                <Check className="h-3 w-3" aria-hidden />
                Pledged
              </span>
            ) : null}
            <span className="font-serif text-3xl text-brand-ink tracking-wide">
              {formatMonthly(amount)}
              <span className="text-base text-brand-ink/60">/mo</span>
            </span>
            <span className="mt-3 text-sm font-medium text-brand-primary group-hover:underline">
              Partner at {formatMonthly(amount)}/month
            </span>
            <span className="mt-2 text-xs text-brand-ink/60 leading-relaxed">
              {!campaignActive
                ? "Tap to give monthly"
                : willAdd
                  ? "Tap to pledge & give"
                  : "Tap to give again"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

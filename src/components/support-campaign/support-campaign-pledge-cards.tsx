"use client";

import {
  PARTNERSHIP_LEVELS,
  type PartnershipLevel,
} from "@/data/support-campaign-config";

function formatMonthly(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SupportCampaignPledgeCards({
  onSelectLevel,
}: {
  onSelectLevel: (amount: PartnershipLevel) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {PARTNERSHIP_LEVELS.map((amount) => (
        <button
          key={amount}
          type="button"
          onClick={() => onSelectLevel(amount)}
          className="group relative flex flex-col items-start rounded-xl border border-brand-primary/20 bg-brand-surface/90 px-5 py-6 text-left shadow-sm transition-all hover:border-brand-primary/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
        >
          <span className="font-serif text-3xl text-brand-ink tracking-wide">
            {formatMonthly(amount)}
            <span className="text-base text-brand-ink/60">/mo</span>
          </span>
          <span className="mt-3 text-sm font-medium text-brand-primary group-hover:underline">
            Partner at {formatMonthly(amount)}/month
          </span>
          <span className="mt-2 text-xs text-brand-ink/60 leading-relaxed">Tap to give monthly</span>
        </button>
      ))}
    </div>
  );
}

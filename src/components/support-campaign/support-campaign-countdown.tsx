"use client";

import { useEffect, useState } from "react";
import { CAMPAIGN_COPY } from "@/data/support-campaign-config";
import {
  getCampaignCountdown,
  padCountdownUnit,
  type CampaignCountdownState,
} from "@/lib/support-campaign/campaign-countdown";

function CountdownUnit({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex w-full min-w-0 flex-col items-center rounded-xl border border-brand-primary/25 bg-white/80 px-2 py-2.5 shadow-sm sm:py-3">
      <span className="font-serif text-2xl sm:text-3xl tabular-nums tracking-wide text-brand-ink">
        {value}
      </span>
      <span className="mt-1 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary/80">
        {label}
      </span>
    </div>
  );
}

export function SupportCampaignCountdown({
  onActiveChange,
}: {
  onActiveChange?: (active: boolean) => void;
}) {
  const [state, setState] = useState<CampaignCountdownState>(() => getCampaignCountdown());

  useEffect(() => {
    const tick = () => {
      const next = getCampaignCountdown();
      setState(next);
      onActiveChange?.(next.active);
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [onActiveChange]);

  if (!state.active) {
    return (
      <div className="rounded-2xl border border-brand-primary/20 bg-white/70 px-4 py-5 sm:px-6 sm:py-6">
        <p className="font-serif text-xl sm:text-2xl text-brand-ink tracking-wide">
          {CAMPAIGN_COPY.countdownEndedLabel}
        </p>
      </div>
    );
  }

  const { days, hours, minutes, seconds } = state.remaining;

  return (
    <div className="rounded-2xl border border-brand-primary/20 bg-white/70 px-4 py-4 sm:px-6 sm:py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
        {CAMPAIGN_COPY.countdownActiveLabel}
      </p>
      <div
        className="mt-3 grid grid-cols-4 gap-2 sm:gap-3"
        role="timer"
        aria-live="polite"
        aria-label={`${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds remaining`}
      >
        <CountdownUnit label="Days" value={padCountdownUnit(days)} />
        <CountdownUnit label="Hours" value={padCountdownUnit(hours)} />
        <CountdownUnit label="Minutes" value={padCountdownUnit(minutes)} />
        <CountdownUnit label="Seconds" value={padCountdownUnit(seconds)} />
      </div>
    </div>
  );
}

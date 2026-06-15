"use client";

import { CAMPAIGN_GOAL } from "@/data/support-campaign-config";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SupportCampaignMeter({
  pledgedAmount,
  goalAmount = CAMPAIGN_GOAL,
  variant = "default",
}: {
  pledgedAmount: number;
  goalAmount?: number;
  variant?: "default" | "compact";
}) {
  const pledged = Math.max(0, pledgedAmount);
  const goal = Math.max(1, goalAmount);
  const remaining = Math.max(0, goal - pledged);
  const percent = Math.min(100, Math.round((pledged / goal) * 100));
  const compact = variant === "compact";

  return (
    <div
      className={cn(
        "rounded-2xl border border-brand-primary/25 bg-white/75 shadow-sm text-left",
        compact ? "p-4 sm:p-5" : "p-6 sm:p-8",
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4">
        <div>
          <p
            className={cn(
              "font-semibold uppercase tracking-[0.16em] text-brand-primary",
              compact ? "text-[10px] sm:text-xs" : "text-xs",
            )}
          >
            Campaign Progress
          </p>
          <p
            className={cn(
              "mt-1 font-serif text-brand-ink tracking-wide",
              compact ? "text-xl sm:text-2xl" : "mt-2 text-2xl sm:text-3xl",
            )}
          >
            {formatCurrency(pledged)}{" "}
            <span className={cn("text-brand-ink/60", compact ? "text-sm sm:text-base" : "text-lg")}>
              pledged
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className={cn("text-brand-ink/70", compact ? "text-xs" : "text-sm")}>Goal</p>
          <p className={cn("font-semibold text-brand-ink", compact ? "text-sm sm:text-base" : "")}>
            {formatCurrency(goal)}/month
          </p>
        </div>
      </div>

      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-brand-primary/10",
          compact ? "mt-4 h-2.5" : "mt-6 h-4",
        )}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={pledged}
        aria-label={`Campaign progress: ${formatCurrency(pledged)} of ${formatCurrency(goal)} monthly goal`}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2",
          compact ? "mt-2.5 text-xs" : "mt-4 text-sm",
        )}
      >
        <span className="font-medium text-brand-primary">{percent}% of goal</span>
        <span className="text-brand-ink/75">
          {remaining > 0 ? (
            <>
              <span className="font-medium text-brand-ink">{formatCurrency(remaining)}</span> remaining
            </>
          ) : (
            <span className="font-medium text-brand-primary">Goal reached — thank you!</span>
          )}
        </span>
      </div>

      <p
        className={cn(
          "text-brand-ink/60 leading-relaxed border-t border-brand-primary/10",
          compact ? "mt-2.5 pt-2.5 text-[11px] leading-snug" : "mt-4 pt-4 text-xs",
        )}
      >
        Progress reflects shared campaign commitments and may be updated as new pledges are confirmed.
      </p>
    </div>
  );
}

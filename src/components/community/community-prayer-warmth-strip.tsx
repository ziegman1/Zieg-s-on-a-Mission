"use client";

import {
  prayerAvatarStackLabels,
  prayerParticipationWarmthLabel,
} from "@/lib/community/prayer-warmth-copy";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  "bg-brand-primary/15 text-brand-primary/90",
  "bg-brand-primary/10 text-brand-primary/80",
  "bg-brand-surface text-brand-ink/55",
];

export function CommunityPrayerWarmthStrip({
  prayingCount,
  prayerResponseCount,
  className,
  compact = false,
}: {
  /** Count of “Praying” acknowledgments (`prayed` reaction type). */
  prayingCount: number;
  prayerResponseCount: number;
  className?: string;
  compact?: boolean;
}) {
  const showStack = prayingCount >= 2;
  const label = showStack
    ? prayerParticipationWarmthLabel(prayingCount, prayerResponseCount)
    : null;
  const stackSize = showStack
    ? Math.min(3, Math.max(prayingCount > 0 ? 1 : 0, prayerResponseCount > 0 ? 1 : 0))
    : 0;
  const initials = showStack
    ? prayerAvatarStackLabels(prayingCount > 0 ? prayingCount : prayerResponseCount)
    : [];

  if (!label && stackSize === 0) return null;

  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      {initials.length > 0 ? (
        <div className="flex shrink-0 items-center -space-x-1.5" aria-hidden>
          {initials.map((init, i) => (
            <span
              key={init}
              className={cn(
                "inline-flex items-center justify-center rounded-full ring-2 ring-white font-medium text-[9px]",
                compact ? "h-6 w-6" : "h-6 w-6",
                AVATAR_COLORS[i % AVATAR_COLORS.length],
              )}
            >
              {init}
            </span>
          ))}
        </div>
      ) : null}
      {label ? (
        <p
          className={cn(
            "leading-snug text-brand-ink/48 truncate min-w-0",
            compact ? "text-[10px]" : "text-[11px]",
          )}
        >
          {label}
        </p>
      ) : null}
    </div>
  );
}

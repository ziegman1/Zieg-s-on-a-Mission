"use client";

import type { LucideIcon } from "lucide-react";
import type { CommunityReactionType, ReactionCounts } from "@/lib/community/types";
import { CommunityHorizontalFadeScroll } from "./community-horizontal-fade-scroll";
import { cn } from "@/lib/utils";

export type ReactionChipConfig = {
  type: CommunityReactionType;
  label: string;
  Icon: LucideIcon;
};

export function CommunityReactionScrollRow({
  reactions,
  counts,
  myReactions,
  disabled,
  onToggle,
  compact = false,
  ariaLabel = "Reactions",
}: {
  reactions: ReactionChipConfig[];
  counts: ReactionCounts;
  myReactions: Set<CommunityReactionType>;
  disabled?: boolean;
  onToggle: (type: CommunityReactionType) => void;
  compact?: boolean;
  ariaLabel?: string;
}) {
  const pillBase = cn(
    "inline-flex shrink-0 snap-start items-center gap-1 rounded-full",
    compact ? "min-h-[2rem] px-2.5 text-[11px]" : "min-h-[2.125rem] px-2.5 text-xs",
    "font-medium border transition-all duration-150 ease-out",
    "bg-white/90 text-brand-ink/68 border-black/[0.04]",
    "shadow-[0_1px_2px_rgba(30,54,68,0.03)]",
    "hover:bg-white hover:border-brand-primary/12 hover:text-brand-ink/85",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
    "active:scale-[0.96] touch-manipulation",
  );

  return (
    <CommunityHorizontalFadeScroll ariaLabel={ariaLabel}>
      {reactions.map(({ type, label, Icon }) => {
        const active = myReactions.has(type);
        const count = counts[type] ?? 0;
        return (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(type)}
            aria-pressed={active}
            className={cn(
              pillBase,
              active &&
                "bg-brand-primary/90 text-white border-brand-primary/80 shadow-[0_2px_8px_rgba(131,176,218,0.28)]",
              disabled && "opacity-55",
            )}
          >
            <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5")} aria-hidden />
            <span>{label}</span>
            {count > 0 ? (
              <span
                className={cn(
                  "tabular-nums text-[10px]",
                  active ? "text-white/88" : "text-brand-ink/40",
                )}
              >
                {count}
              </span>
            ) : null}
          </button>
        );
      })}
    </CommunityHorizontalFadeScroll>
  );
}

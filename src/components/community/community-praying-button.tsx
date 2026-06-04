"use client";

import { cn } from "@/lib/utils";

/** DB reaction type for the sole prayer-space acknowledgment control. */
export const PRAYING_REACTION_TYPE = "prayed" as const;

export function CommunityPrayingButton({
  count,
  active,
  disabled,
  onToggle,
  className,
  showCount = false,
  peoplePrayingLabel = false,
}: {
  count: number;
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
  className?: string;
  /** When true, append reaction count (e.g. "Praying · 3"). */
  showCount?: boolean;
  /** Prayer room: show "People praying · N" when count > 0 and showCount is true. */
  peoplePrayingLabel?: boolean;
}) {
  const label =
    showCount && count > 0
      ? peoplePrayingLabel
        ? count === 1
          ? "People praying · 1"
          : `People praying · ${count}`
        : `Praying · ${count}`
      : "Praying";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-pressed={active}
      aria-label={
        active
          ? `You are praying (${count} ${count === 1 ? "person" : "people"} praying)`
          : `Mark as praying (${count} ${count === 1 ? "person" : "people"} praying)`
      }
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-1",
        "text-[12px] font-medium leading-tight transition-all duration-150 ease-out",
        "touch-manipulation active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
        active
          ? "bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/25"
          : "bg-white/70 text-brand-ink/60 ring-1 ring-black/[0.06] hover:bg-white hover:ring-brand-primary/15 hover:text-brand-ink/75",
        disabled && "opacity-55",
        className,
      )}
    >
      <span className="tabular-nums">{label}</span>
    </button>
  );
}

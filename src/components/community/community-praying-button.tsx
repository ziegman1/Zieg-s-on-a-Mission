"use client";

import { cn } from "@/lib/utils";

/** DB reaction type for the sole prayer-space acknowledgment control. */
export const PRAYING_REACTION_TYPE = "prayed" as const;

function prayingLabel(count: number): string {
  if (count <= 0) return "Praying";
  return `Praying · ${count}`;
}

const pillBase = cn(
  "inline-flex w-auto max-w-full shrink-0 items-center gap-1 rounded-full px-2.5 py-1",
  "text-[12.5px] font-medium leading-tight transition-all duration-150 ease-out",
  "touch-manipulation active:scale-[0.98]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
);

export function CommunityPrayingButton({
  count,
  active,
  disabled,
  onToggle,
  className,
}: {
  count: number;
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const label = prayingLabel(count);

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
        pillBase,
        active
          ? "bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/25"
          : "bg-white/70 text-brand-ink/65 ring-1 ring-black/[0.06] hover:bg-white hover:ring-brand-primary/15 hover:text-brand-ink/80",
        disabled && "opacity-55",
        className,
      )}
    >
      <span aria-hidden className="text-[13px] leading-none">
        🙏
      </span>
      <span className="tabular-nums">{label}</span>
    </button>
  );
}

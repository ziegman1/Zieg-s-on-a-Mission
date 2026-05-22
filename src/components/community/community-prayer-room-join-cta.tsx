"use client";

import { cn } from "@/lib/utils";

export function CommunityPrayerRoomJoinCta({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full px-5 py-2.5",
        "text-[14px] font-medium text-white",
        "bg-brand-primary border border-brand-primary/90",
        "shadow-[0_2px_12px_rgba(131,176,218,0.32)]",
        "hover:bg-brand-primary/93 hover:shadow-[0_3px_16px_rgba(131,176,218,0.36)]",
        "active:scale-[0.98] touch-manipulation transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45 focus-visible:ring-offset-2",
        className,
      )}
    >
      Join in Prayer
    </button>
  );
}

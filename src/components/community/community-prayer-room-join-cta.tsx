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
    <div className={cn("flex justify-center px-2", className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5",
          "text-[14px] font-medium text-white",
          "bg-brand-primary border border-brand-primary/90",
          "shadow-[0_4px_20px_rgba(131,176,218,0.38)]",
          "hover:bg-brand-primary/93 hover:shadow-[0_6px_24px_rgba(131,176,218,0.42)]",
          "active:scale-[0.98] touch-manipulation transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45 focus-visible:ring-offset-2",
        )}
      >
        <span aria-hidden className="text-[15px] leading-none">
          🙏
        </span>
        <span>Join in Prayer</span>
      </button>
    </div>
  );
}

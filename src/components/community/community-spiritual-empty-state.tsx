"use client";

import { HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";

export function CommunitySpiritualEmptyState({
  onShareRequest,
  showOwnerCta = false,
  variant = "default",
}: {
  onShareRequest?: () => void;
  showOwnerCta?: boolean;
  variant?: "default" | "prayer";
}) {
  const prayer = variant === "prayer";
  return (
    <div
      className={cn(
        "rounded-2xl px-6 sm:px-10 py-12 sm:py-14 text-center",
        "bg-white/40 backdrop-blur-[2px]",
        "ring-1 ring-black/[0.03]",
      )}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary/80 mb-5">
        <HandHeart className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="font-serif text-xl sm:text-[1.35rem] text-brand-ink/90 tracking-wide leading-snug max-w-md mx-auto">
        {prayer ? "No prayer requests have been shared yet" : "Nothing shared in this room yet"}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-brand-ink/58 max-w-sm mx-auto">
        {prayer
          ? "Be the first to encourage this community through prayer, praise, or testimony."
          : "When someone shares here, it will appear in this sacred space."}
      </p>
      {showOwnerCta && onShareRequest ? (
        <button
          type="button"
          onClick={onShareRequest}
          className={cn(
            "mt-7 inline-flex items-center justify-center rounded-full",
            "px-6 py-2.5 text-sm font-medium",
            "bg-brand-primary/85 text-white",
            "shadow-[0_2px_12px_rgba(131,176,218,0.22)]",
            "hover:bg-brand-primary transition-colors duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35 focus-visible:ring-offset-2",
          )}
        >
          {prayer ? "Join in Prayer" : "Share a prayer request"}
        </button>
      ) : (
        <p className="mt-6 text-xs text-brand-ink/45">
          Check back soon — our family will share here.
        </p>
      )}
    </div>
  );
}

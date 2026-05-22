"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function CommunityPrayerToast({
  message,
  visible,
  className,
  style,
}: {
  message: string;
  visible: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={style}
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[70] mx-auto max-w-md",
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
        className,
      )}
    >
      <p
        className={cn(
          "rounded-full bg-brand-ink px-4 py-3 text-center text-sm font-medium text-white",
          "shadow-[0_8px_24px_rgba(30,54,68,0.22)]",
        )}
      >
        {message}
      </p>
    </div>
  );
}

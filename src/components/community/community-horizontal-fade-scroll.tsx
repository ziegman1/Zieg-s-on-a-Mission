"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * iOS-style horizontal scroll with edge fades and hidden scrollbar.
 */
export function CommunityHorizontalFadeScroll({
  children,
  className,
  innerClassName,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-6 bg-gradient-to-r from-[var(--mh-scroll-fade-from,#faf8f6)] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-[var(--mh-scroll-fade-from,#faf8f6)] to-transparent"
        aria-hidden
      />
      <div
        role={ariaLabel ? "group" : undefined}
        aria-label={ariaLabel}
        className={cn(
          "mh-scrollbar-none flex gap-1.5 overflow-x-auto overscroll-x-contain",
          "[-webkit-overflow-scrolling:touch] [scroll-snap-type:x_proximity]",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

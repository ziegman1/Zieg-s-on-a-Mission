"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

const CLAMP_LINES = 4;
const MIN_CHARS_FOR_CLAMP = 180;

export function CommunityPostBodyClamp({
  fullBody,
  expanded,
  onToggleExpand,
  className,
}: {
  fullBody: string;
  expanded: boolean;
  onToggleExpand: () => void;
  className?: string;
}) {
  const canExpand = useMemo(
    () => fullBody.length > MIN_CHARS_FOR_CLAMP || fullBody.split("\n").length > CLAMP_LINES,
    [fullBody],
  );

  if (!fullBody) return null;

  if (expanded) {
    return (
      <div className={cn("space-y-1 min-w-0", className)}>
        <p className="whitespace-pre-wrap break-words text-brand-ink/88 text-[15px] leading-[1.65]">
          {fullBody}
        </p>
        {canExpand ? (
          <button
            type="button"
            onClick={onToggleExpand}
            className="text-sm font-medium text-brand-primary/90 hover:text-brand-primary hover:underline transition-colors"
          >
            Show less
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("relative min-w-0", className)}>
      <p
        className={cn(
          "whitespace-pre-wrap break-words text-brand-ink/88 text-[15px] leading-[1.65]",
          canExpand && "line-clamp-4",
        )}
      >
        {fullBody}
      </p>
      {canExpand ? (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[var(--mh-scroll-fade-from,rgba(255,255,255,0.96))] via-white/50 to-transparent"
            aria-hidden
          />
          <button
            type="button"
            onClick={onToggleExpand}
            className="relative z-[1] mt-1 text-sm font-medium text-brand-primary/90 hover:text-brand-primary hover:underline transition-colors"
          >
            Read more
          </button>
        </>
      ) : null}
    </div>
  );
}

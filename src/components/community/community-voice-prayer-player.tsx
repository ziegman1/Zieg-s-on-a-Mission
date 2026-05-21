"use client";

import { Mic } from "lucide-react";
import { formatPrayerDuration } from "@/lib/community/prayer-response-body";
import { cn } from "@/lib/utils";

export function CommunityVoicePrayerPlayer({
  audioUrl,
  durationSeconds,
  className,
}: {
  audioUrl: string;
  durationSeconds?: number | null;
  className?: string;
}) {
  const durationLabel = formatPrayerDuration(durationSeconds);

  return (
    <div
      className={cn(
        "rounded-xl bg-brand-primary/[0.05] ring-1 ring-brand-primary/12 px-3 py-2.5",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary"
          aria-hidden
        >
          <Mic className="h-3.5 w-3.5" />
        </span>
        {durationLabel ? (
          <span className="text-[11px] font-medium text-brand-ink/50 tabular-nums">
            {durationLabel}
          </span>
        ) : null}
      </div>
      <audio
        controls
        src={audioUrl}
        className="w-full h-11 min-h-[2.75rem] rounded-lg"
        preload="metadata"
        controlsList="nodownload"
      />
    </div>
  );
}

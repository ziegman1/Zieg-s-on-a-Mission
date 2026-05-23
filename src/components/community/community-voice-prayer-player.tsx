"use client";

import { Mic, Video } from "lucide-react";
import { formatPrayerDuration } from "@/lib/community/prayer-response-body";
import { PRAYER_RECORDER_COPY } from "@/lib/community/prayer-recorder-copy";
import { shouldUseVideoPrayerPlayer } from "@/lib/community/prayer-media-playback";
import { cn } from "@/lib/utils";

export function CommunityVoicePrayerPlayer({
  audioUrl,
  durationSeconds,
  mimeType,
  hasVideo,
  className,
  showPlayLabel = false,
}: {
  audioUrl: string;
  durationSeconds?: number | null;
  mimeType?: string | null;
  hasVideo?: boolean | null;
  className?: string;
  showPlayLabel?: boolean;
}) {
  const isVideo = shouldUseVideoPrayerPlayer({ mimeType, hasVideo });
  const durationLabel = formatPrayerDuration(durationSeconds);
  const label = isVideo
    ? PRAYER_RECORDER_COPY.playerVideoLabel
    : PRAYER_RECORDER_COPY.playerVoiceLabel;

  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-to-br from-brand-primary/[0.06] to-white",
        "ring-1 ring-brand-primary/10 px-3 py-2.5",
        "shadow-[0_1px_8px_rgba(131,176,218,0.08)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary/12 text-brand-primary shadow-sm"
          aria-hidden
        >
          {isVideo ? <Video className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          {showPlayLabel ? (
            <span className="text-sm font-medium text-brand-ink block">{label}</span>
          ) : null}
          {durationLabel ? (
            <span className="text-[11px] font-medium text-brand-ink/48 tabular-nums">
              {durationLabel}
            </span>
          ) : null}
        </div>
      </div>
      {isVideo ? (
        <video
          controls
          src={audioUrl}
          className="w-full max-h-64 rounded-lg bg-black/[0.04]"
          preload="metadata"
          playsInline
        />
      ) : (
        <audio
          controls
          src={audioUrl}
          className="w-full h-10 min-h-[2.5rem] rounded-lg accent-brand-primary"
          preload="metadata"
          controlsList="nodownload"
        />
      )}
    </div>
  );
}

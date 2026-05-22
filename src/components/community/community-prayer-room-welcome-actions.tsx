"use client";

import { ChevronDown, HandHeart, Mic, Sparkles, Users } from "lucide-react";
import {
  formatPrayerRoomActivityLabel,
  PRAYER_ROOM_COMPOSER_PRESETS,
  summarizePrayerRoomActivity,
  type PrayerRoomComposerKind,
} from "@/lib/community/prayer-room-composer";
import type { CommunityPostFeedItem } from "@/lib/community/types";
import { cn } from "@/lib/utils";

const CTA_ICONS: Record<PrayerRoomComposerKind, typeof HandHeart> = {
  prayer_request: HandHeart,
  praise_report: Sparkles,
  encouragement: Users,
  voice_prayer: Mic,
};

const CTA_ORDER: PrayerRoomComposerKind[] = [
  "prayer_request",
  "praise_report",
  "encouragement",
  "voice_prayer",
];

export function CommunityPrayerRoomWelcomeActions({
  posts,
  allowVoice,
  onCompose,
  onScrollToFeed,
  className,
}: {
  posts: CommunityPostFeedItem[];
  allowVoice: boolean;
  onCompose: (kind: PrayerRoomComposerKind) => void;
  onScrollToFeed: () => void;
  className?: string;
}) {
  const summary = summarizePrayerRoomActivity(posts);
  const activityLabel = formatPrayerRoomActivityLabel(summary);

  const kinds = CTA_ORDER.filter(
    (k) => k !== "voice_prayer" || allowVoice,
  );

  return (
    <div className={cn("space-y-2.5", className)}>
      <div
        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        role="group"
        aria-label="Share in the Prayer & Praise Room"
      >
        {kinds.map((kind) => {
          const preset = PRAYER_ROOM_COMPOSER_PRESETS[kind];
          const Icon = CTA_ICONS[kind];
          return (
            <button
              key={kind}
              type="button"
              onClick={() => onCompose(kind)}
              className={cn(
                "inline-flex w-full items-center justify-center gap-2 rounded-full px-3.5 py-2.5",
                "text-[13px] font-medium text-brand-ink/88",
                "bg-white/80 ring-1 ring-brand-primary/12",
                "shadow-[0_1px_6px_rgba(30,54,68,0.04)]",
                "hover:bg-white hover:ring-brand-primary/22",
                "active:scale-[0.98] touch-manipulation",
                "transition-[transform,background-color,box-shadow] duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
              )}
            >
              <Icon className="h-3.5 w-3.5 text-brand-primary shrink-0" aria-hidden />
              <span className="text-center leading-snug">{preset.ctaLabel}</span>
            </button>
          );
        })}
      </div>

      {summary.total > 0 ? (
        <button
          type="button"
          onClick={onScrollToFeed}
          className={cn(
            "inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3.5 py-2",
            "text-[13px] font-medium text-brand-primary/90",
            "bg-brand-primary/[0.06] ring-1 ring-brand-primary/12",
            "hover:bg-brand-primary/10 active:scale-[0.98]",
            "transition-all duration-150 ease-out touch-manipulation",
          )}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/90 animate-pulse" aria-hidden />
          {activityLabel}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden />
        </button>
      ) : (
        <p className="text-center text-[13px] text-brand-ink/48 italic px-2 leading-relaxed">
          Be the first to share a prayer, praise, or word of encouragement.
        </p>
      )}
    </div>
  );
}

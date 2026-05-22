"use client";

import { ChevronDown } from "lucide-react";
import {
  formatPrayerRoomActivityLabel,
  summarizePrayerRoomActivity,
} from "@/lib/community/prayer-room-composer";
import type { CommunityPostFeedItem } from "@/lib/community/types";
import { CommunityPrayerRoomJoinCta } from "./community-prayer-room-join-cta";
import { cn } from "@/lib/utils";

export function CommunityPrayerRoomWelcomeActions({
  posts,
  onJoin,
  onScrollToFeed,
  className,
}: {
  posts: CommunityPostFeedItem[];
  onJoin: () => void;
  onScrollToFeed: () => void;
  className?: string;
}) {
  const summary = summarizePrayerRoomActivity(posts);
  const activityLabel = formatPrayerRoomActivityLabel(summary);

  return (
    <div className={cn("space-y-2", className)}>
      <CommunityPrayerRoomJoinCta onClick={onJoin} />

      {summary.total > 0 ? (
        <button
          type="button"
          onClick={onScrollToFeed}
          className={cn(
            "mx-auto flex w-auto max-w-full items-center justify-center gap-1.5 rounded-full px-3 py-1.5",
            "text-[12px] font-medium text-brand-primary/85",
            "hover:bg-brand-primary/[0.06] active:scale-[0.98]",
            "transition-all duration-150 ease-out touch-manipulation",
          )}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/90 animate-pulse" aria-hidden />
          {activityLabel}
          <ChevronDown className="h-3 w-3 opacity-55" aria-hidden />
        </button>
      ) : (
        <p className="text-center text-[12px] text-brand-ink/45 italic px-3 leading-relaxed">
          Be the first to share a prayer, praise, or word of encouragement.
        </p>
      )}
    </div>
  );
}

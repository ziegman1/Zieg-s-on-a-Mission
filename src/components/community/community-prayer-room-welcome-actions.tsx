"use client";

import {
  derivePrayerRoomWelcomeMetrics,
  formatViewRequestsLabel,
  viewRequestsAriaLabel,
} from "@/lib/community/prayer-room-engagement-metrics";
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
  const metrics = derivePrayerRoomWelcomeMetrics(posts);
  const viewLabel = formatViewRequestsLabel(metrics.requestPostCount);

  return (
    <div className={cn("px-2", className)}>
      <div className="mx-auto flex w-full max-w-lg items-center gap-3 min-w-0">
        <CommunityPrayerRoomJoinCta onClick={onJoin} />

        <button
          type="button"
          onClick={onScrollToFeed}
          aria-label={viewRequestsAriaLabel(metrics.requestPostCount)}
          className={cn(
            "ml-auto shrink-0 inline-flex items-center rounded-full px-3 py-1.5",
            "text-[12px] font-semibold leading-tight text-brand-primary",
            "bg-brand-primary/8 ring-1 ring-brand-primary/15",
            "hover:bg-brand-primary/12 hover:text-brand-primary",
            "transition-colors duration-150 touch-manipulation active:opacity-80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
          )}
        >
          {viewLabel}
        </button>
      </div>
    </div>
  );
}

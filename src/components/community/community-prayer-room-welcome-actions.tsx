"use client";

import { summarizePrayerRoomActivity } from "@/lib/community/prayer-room-composer";
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
  const activityCount = summary.total;

  const activityAriaLabel =
    activityCount === 0
      ? "View room activity — no posts yet"
      : `View room activity — ${activityCount} ${activityCount === 1 ? "post" : "posts"} shared`;

  return (
    <div className={cn("px-2", className)}>
      <div className="mx-auto flex w-full max-w-lg items-center gap-3 min-w-0">
        <CommunityPrayerRoomJoinCta onClick={onJoin} />

        <button
          type="button"
          onClick={onScrollToFeed}
          aria-label={activityAriaLabel}
          className={cn(
            "ml-auto shrink-0 inline-flex items-center gap-0.5 py-1 pl-1 min-h-[2.5rem] min-w-[2.5rem] justify-center",
            "text-brand-primary/70 hover:text-brand-primary",
            "transition-colors duration-150 touch-manipulation active:opacity-80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 rounded-md",
          )}
        >
          <span className="text-[15px] leading-none" aria-hidden>
            🙏
          </span>
          <span className="tabular-nums text-[13px] font-semibold leading-none">
            {activityCount}
          </span>
        </button>
      </div>
    </div>
  );
}

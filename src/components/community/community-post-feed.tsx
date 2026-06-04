"use client";

import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import { filterHubAllFeedPosts } from "@/lib/community/feed-filters";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunityPostFeedItem } from "@/lib/community/types";
import { useMemo } from "react";
import type { MissionHubLandingMode } from "@/lib/community/mission-hub-scroll";
import { CommunityPostCard } from "./community-post-card";
import { MissionHubInitialLandingScroll } from "./mission-hub-initial-landing-scroll";

export function CommunityPostFeed({
  posts,
  showSpaceLabel = true,
  variant = "default",
  owner = null,
  composerSpaces = [],
  landingMode = "none",
  landingRouteKey,
}: {
  posts: CommunityPostFeedItem[];
  showSpaceLabel?: boolean;
  heading?: string | null;
  variant?: "default" | "spiritual";
  owner?: CommunityOwner | null;
  composerSpaces?: CommunityComposerSpace[];
  landingMode?: MissionHubLandingMode;
  landingRouteKey?: string;
}) {
  const displayPosts = useMemo(
    () => (showSpaceLabel ? filterHubAllFeedPosts(posts) : posts),
    [posts, showSpaceLabel],
  );

  if (displayPosts.length === 0) return null;

  const latestPostId = displayPosts[0]?.id ?? null;
  const routeKey = landingRouteKey ?? (landingMode !== "none" ? `feed:${latestPostId ?? ""}` : "");

  const spiritual = variant === "spiritual";

  return (
    <>
      {landingMode !== "none" && routeKey ? (
        <MissionHubInitialLandingScroll
          mode={landingMode}
          latestPostId={latestPostId}
          routeKey={routeKey}
        />
      ) : null}
      <ul
      className={spiritual ? "space-y-3 sm:space-y-3.5" : "space-y-2.5 sm:space-y-3"}
      aria-label="Posts"
    >
      {displayPosts.map((post, index) => (
        <li
          key={post.id}
          className="animate-in fade-in slide-in-from-top-1 duration-300 motion-reduce:animate-none"
        >
          <CommunityPostCard
            post={post}
            showSpaceLabel={showSpaceLabel}
            variant={variant}
            owner={owner}
            composerSpaces={composerSpaces}
            isLatestInFeed={index === 0}
          />
        </li>
      ))}
    </ul>
    </>
  );
}

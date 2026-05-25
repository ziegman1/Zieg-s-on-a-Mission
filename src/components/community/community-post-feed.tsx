"use client";

import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import { filterHubAllFeedPosts } from "@/lib/community/feed-filters";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunityPostFeedItem } from "@/lib/community/types";
import { useMemo } from "react";
import { CommunityPostCard } from "./community-post-card";

export function CommunityPostFeed({
  posts,
  showSpaceLabel = true,
  variant = "default",
  owner = null,
  composerSpaces = [],
}: {
  posts: CommunityPostFeedItem[];
  showSpaceLabel?: boolean;
  heading?: string | null;
  variant?: "default" | "spiritual";
  owner?: CommunityOwner | null;
  composerSpaces?: CommunityComposerSpace[];
}) {
  const displayPosts = useMemo(
    () => (showSpaceLabel ? filterHubAllFeedPosts(posts) : posts),
    [posts, showSpaceLabel],
  );

  if (displayPosts.length === 0) return null;

  const spiritual = variant === "spiritual";

  return (
    <ul
      className={spiritual ? "space-y-3 sm:space-y-3.5" : "space-y-2.5 sm:space-y-3"}
      aria-label="Posts"
    >
      {displayPosts.map((post) => (
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
          />
        </li>
      ))}
    </ul>
  );
}

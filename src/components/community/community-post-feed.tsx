import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunityPostFeedItem } from "@/lib/community/types";
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
  if (posts.length === 0) return null;

  const spiritual = variant === "spiritual";

  return (
    <ul
      className={spiritual ? "space-y-4 sm:space-y-5" : "space-y-2.5 sm:space-y-3"}
      aria-label="Posts"
    >
      {posts.map((post) => (
        <li key={post.id}>
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

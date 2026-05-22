import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunitySpaceDetail } from "@/lib/community/space-experience";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunityPostFeedItem } from "@/lib/community/types";
import { CommunityFeedEmpty } from "./community-feed-empty";
import { CommunityPostFeed } from "./community-post-feed";
import { CommunitySpacePageHeader } from "./community-space-page-header";
import { CommunitySpaceWelcomeCard } from "./community-space-welcome-card";

export function CommunitySpaceFeed({
  space,
  posts,
  owner = null,
  composerSpaces = [],
}: {
  space: CommunitySpaceDetail;
  posts: CommunityPostFeedItem[];
  owner?: CommunityOwner | null;
  composerSpaces?: CommunityComposerSpace[];
}) {
  const prompt = space.experience.engagementPrompt;
  const showWelcome =
    space.experience.showWelcomeMessage && Boolean(space.experience.welcomeMessage?.trim());
  return (
    <div className="space-y-4">
      <CommunitySpacePageHeader
        title={space.title}
        subtitle={space.description?.trim() || undefined}
      />
      {showWelcome ? <CommunitySpaceWelcomeCard space={space} /> : null}
      {posts.length > 0 ? (
        <CommunityPostFeed
          posts={posts}
          showSpaceLabel={false}
          owner={owner}
          composerSpaces={composerSpaces}
        />
      ) : (
        <CommunityFeedEmpty
          variant="space"
          title="No posts in this space yet"
          body={
            prompt
              ? `${prompt} When your team shares here, posts will appear below.`
              : "When your team shares an update here, it will appear in this feed."
          }
        />
      )}
      {prompt && posts.length > 0 ? (
        <p className="text-center text-xs text-brand-ink/40 italic px-4 pb-2">{prompt}</p>
      ) : null}
    </div>
  );
}

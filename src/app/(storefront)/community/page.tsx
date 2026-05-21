import type { Metadata } from "next";
import { CommunityAppShell } from "@/components/community/community-app-shell";
import { CommunityFeedEmpty } from "@/components/community/community-feed-empty";
import { CommunityPostFeed } from "@/components/community/community-post-feed";
import { PLACEHOLDER_COMMUNITY_SPACES } from "@/data/community-placeholder-spaces";
import { listComposerSpacesForOwner } from "@/lib/community/composer-spaces";
import { getCurrentCommunityOwner } from "@/lib/community/owner";
import { listPublishedPostsFeed } from "@/lib/community/posts";
import { listPublishedCommunitySpaces } from "@/lib/community/spaces";
import { getVisitorKey } from "@/lib/community/visitor-key";
import { getSiteCopy } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  return {
    title: "Mission Hub",
    description: `Community feed for ${copy.site.name} — latest posts from our ministry family.`,
  };
}

export default async function CommunityPage() {
  const [owner, visitorKey] = await Promise.all([
    getCurrentCommunityOwner(),
    getVisitorKey(),
  ]);

  let publishedSpaces: Awaited<ReturnType<typeof listPublishedCommunitySpaces>> = [];
  let posts: Awaited<ReturnType<typeof listPublishedPostsFeed>> = [];
  let composerSpaces: Awaited<ReturnType<typeof listComposerSpacesForOwner>> = [];
  try {
    [publishedSpaces, posts] = await Promise.all([
      listPublishedCommunitySpaces(),
      listPublishedPostsFeed(50, visitorKey),
    ]);
    if (owner) composerSpaces = await listComposerSpacesForOwner();
  } catch (e) {
    console.error("[community] failed to load:", e);
  }

  const hasPublished = publishedSpaces.length > 0;
  const hasPosts = posts.length > 0;
  const plannedSpaces = hasPublished ? [] : PLACEHOLDER_COMMUNITY_SPACES;

  return (
    <CommunityAppShell
      publishedSpaces={publishedSpaces}
      plannedSpaces={plannedSpaces}
      showAdminCreate={false}
      activeSlug={null}
      owner={owner}
      composerSpaces={composerSpaces}
    >
      {hasPosts ? (
        <CommunityPostFeed
          posts={posts}
          showSpaceLabel
          owner={owner}
          composerSpaces={composerSpaces}
        />
      ) : (
        <CommunityFeedEmpty
          showAdminCreate={false}
          variant="hub"
          body="No posts yet. When your team shares an update, it will show up here."
        />
      )}
    </CommunityAppShell>
  );
}

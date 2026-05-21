"use client";

import { useState } from "react";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunitySpaceDetail } from "@/lib/community/space-experience";
import type { CommunityPostFeedItem, CommunityPostType } from "@/lib/community/types";
import { getSpaceInteractionPreset } from "@/lib/community/space-interaction";
import { CommunityCreatePostDialog } from "./community-create-post-dialog";
import { CommunityPrayerParticipationBar } from "./community-prayer-participation-bar";
import { CommunityPostFeed } from "./community-post-feed";
import { CommunitySpiritualEmptyState } from "./community-spiritual-empty-state";
import { CommunitySpaceHero } from "./community-space-hero";
import { CommunitySpaceWelcomeIntro } from "./community-space-welcome-intro";

export function CommunitySpiritualSpaceView({
  space,
  posts,
  owner,
  composerSpaces,
}: {
  space: CommunitySpaceDetail;
  posts: CommunityPostFeedItem[];
  owner: CommunityOwner | null;
  composerSpaces: CommunityComposerSpace[];
}) {
  const [postOpen, setPostOpen] = useState(false);
  const [defaultPostType, setDefaultPostType] = useState<CommunityPostType>("prayer");
  const canCompose = Boolean(owner && composerSpaces.length > 0);
  const prayerRoom =
    getSpaceInteractionPreset(space.experience.spaceType, space.slug).mode === "prayer";

  function openCompose(postType: CommunityPostType = "prayer") {
    setDefaultPostType(postType);
    setPostOpen(true);
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-5">
        <CommunitySpaceHero space={space} />
        <CommunitySpaceWelcomeIntro space={space} />
        {prayerRoom && canCompose ? (
          <CommunityPrayerParticipationBar onAction={(type) => openCompose(type)} />
        ) : null}
        {posts.length > 0 ? (
          <CommunityPostFeed
            posts={posts}
            showSpaceLabel={false}
            variant="spiritual"
            owner={owner}
            composerSpaces={composerSpaces}
          />
        ) : (
          <CommunitySpiritualEmptyState
            showOwnerCta={canCompose}
            onShareRequest={canCompose ? () => openCompose("prayer") : undefined}
            variant={prayerRoom ? "prayer" : "default"}
          />
        )}
        {space.experience.engagementPrompt && posts.length > 0 ? (
          <p className="text-center text-[13px] text-brand-ink/38 italic font-light px-4 pb-1">
            {space.experience.engagementPrompt}
          </p>
        ) : null}
      </div>
      {canCompose ? (
        <CommunityCreatePostDialog
          open={postOpen}
          onOpenChange={setPostOpen}
          spaces={composerSpaces}
          defaultSpaceId={space.id}
          defaultPostType={defaultPostType}
          owner={owner}
        />
      ) : null}
    </>
  );
}

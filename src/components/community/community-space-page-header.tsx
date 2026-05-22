"use client";

import { useState } from "react";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunityPostType } from "@/lib/community/types";
import { CommunityCreatePostComposer } from "./community-create-post-composer";
import { MissionHubHeaderAction } from "./mission-hub-header-action";
import { MissionHubPageHeader } from "./mission-hub-page-header";

export function CommunitySpacePageHeader({
  title,
  subtitle,
  owner,
  composerSpaces,
  defaultSpaceId,
  defaultPostType,
}: {
  title: string;
  subtitle?: string;
  owner: CommunityOwner | null;
  composerSpaces: CommunityComposerSpace[];
  defaultSpaceId: string;
  defaultPostType?: CommunityPostType;
}) {
  const [postOpen, setPostOpen] = useState(false);
  const canPost = Boolean(owner && composerSpaces.length > 0);

  return (
    <>
      <MissionHubPageHeader
        title={title}
        subtitle={subtitle}
        className="mb-1"
        action={
          canPost ? (
            <MissionHubHeaderAction
              label="New Post"
              onClick={() => setPostOpen(true)}
            />
          ) : undefined
        }
      />

      {canPost ? (
        <CommunityCreatePostComposer
          open={postOpen}
          onOpenChange={setPostOpen}
          spaces={composerSpaces}
          defaultSpaceId={defaultSpaceId}
          defaultPostType={defaultPostType}
          owner={owner}
        />
      ) : null}
    </>
  );
}

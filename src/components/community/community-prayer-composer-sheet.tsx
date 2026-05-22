"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import { allowVisitorOnlyComments } from "@/lib/community/members";
import { createVisitorMemberProfileAction } from "@/app/(storefront)/community/member-actions";
import type { CommentAuthorContext, CommunityMemberProfile } from "@/lib/community/members";
import { CommunityBottomSheet } from "./community-bottom-sheet";
import { CommunityJoinPrompt } from "./community-join-prompt";
import { CommunityMemberProfileForm } from "./community-member-profile-form";
import { CommunityPrayerResponseForm } from "./community-prayer-response-form";
import { submitPrayerComment } from "./community-prayer-thread-content";
import { useCommunityCommentAuthor } from "./use-community-comment-author";

export function CommunityPrayerComposerSheet({
  open,
  onOpenChange,
  postId,
  preset,
  returnPath,
  allowVoice,
  onPrayerShared,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  preset: SpaceInteractionPreset;
  returnPath: string;
  allowVoice: boolean;
  onPrayerShared: (commentCount: number) => void;
}) {
  const loadedAuthor = useCommunityCommentAuthor();
  const [authorContext, setAuthorContext] = useState<CommentAuthorContext | null>(null);
  const activeAuthor = authorContext ?? loadedAuthor;

  function handleVisitorProfileCreated(member: CommunityMemberProfile) {
    setAuthorContext({ kind: "visitor", member });
  }

  return (
    <CommunityBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Share a Prayer"
      description="Your prayer encourages our family on mission."
      className="max-h-[min(88dvh,640px)]"
    >
      {activeAuthor === null ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-brand-ink/50">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading…
        </div>
      ) : activeAuthor.kind === "guest" ? (
        allowVisitorOnlyComments() ? (
          <CommunityMemberProfileForm
            onCreated={handleVisitorProfileCreated}
            createAction={createVisitorMemberProfileAction}
          />
        ) : (
          <CommunityJoinPrompt returnPath={returnPath} />
        )
      ) : (
        <CommunityPrayerResponseForm
          postId={postId}
          authorContext={activeAuthor}
          preset={preset}
          allowVoice={allowVoice}
          autoFocus
          variant="sheet"
          onSubmit={async (body) => {
            const { commentCount } = await submitPrayerComment(postId, body);
            onPrayerShared(commentCount);
            onOpenChange(false);
          }}
        />
      )}
    </CommunityBottomSheet>
  );
}

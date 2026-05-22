"use client";

import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import { prayerThreadSummaryLabel } from "@/lib/community/prayer-thread-copy";
import { CommunityBottomSheet } from "./community-bottom-sheet";
import { CommunityPrayerThreadContent } from "./community-prayer-thread-content";

export function CommunityPrayerThreadSheet({
  open,
  onOpenChange,
  postId,
  preset,
  returnPath,
  prayerCount,
  refreshKey,
  onCommentCountChange,
  onRequestSharePrayer,
  allowComments,
  spaceType,
  spaceSlug,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  preset: SpaceInteractionPreset;
  returnPath: string;
  prayerCount: number;
  refreshKey: number;
  onCommentCountChange: (count: number) => void;
  onRequestSharePrayer: () => void;
  allowComments: boolean;
  spaceType?: string;
  spaceSlug?: string;
}) {
  const summary = prayerThreadSummaryLabel(prayerCount, preset.comments);

  return (
    <CommunityBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={preset.comments.sectionLabel}
      description={summary}
      className="max-h-[min(92dvh,720px)]"
    >
      <CommunityPrayerThreadContent
        postId={postId}
        returnPath={returnPath}
        onCommentCountChange={onCommentCountChange}
        onRequestSharePrayer={() => {
          onOpenChange(false);
          onRequestSharePrayer();
        }}
        allowComments={allowComments}
        spaceType={spaceType}
        spaceSlug={spaceSlug}
        refreshKey={refreshKey}
      />
    </CommunityBottomSheet>
  );
}

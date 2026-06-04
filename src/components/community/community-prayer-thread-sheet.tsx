"use client";

import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
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
  onResponseMetricsChange,
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
  onResponseMetricsChange?: (metrics: {
    commentCount: number;
    voiceResponseCount: number;
  }) => void;
  onRequestSharePrayer: () => void;
  allowComments: boolean;
  spaceType?: string;
  spaceSlug?: string;
}) {
  const description =
    prayerCount === 0
      ? preset.comments.threadEmptyHint
      : "A living conversation of prayer for this request.";

  return (
    <CommunityBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={preset.comments.sectionLabel}
      description={description}
      className="max-h-[min(92dvh,720px)]"
    >
      <CommunityPrayerThreadContent
        postId={postId}
        returnPath={returnPath}
        onCommentCountChange={onCommentCountChange}
        onResponseMetricsChange={onResponseMetricsChange}
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

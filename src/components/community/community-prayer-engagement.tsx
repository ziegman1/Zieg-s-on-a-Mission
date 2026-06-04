"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { toggleCommunityPostReactionAction } from "@/app/(storefront)/community/reaction-actions";
import {
  derivePostPrayerEngagementMetrics,
  formatResponsesLabel,
  formatVoicePrayersLabel,
  responsesThreadAriaLabel,
} from "@/lib/community/prayer-room-engagement-metrics";
import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import type { CommunityReactionType, ReactionCounts } from "@/lib/community/types";
import { CommunityPrayerComposerSheet } from "./community-prayer-composer-sheet";
import { CommunityPrayerThreadSheet } from "./community-prayer-thread-sheet";
import { CommunityPrayerToast } from "./community-prayer-toast";
import {
  CommunityPrayingButton,
  PRAYING_REACTION_TYPE,
} from "./community-praying-button";
import { cn } from "@/lib/utils";

const shareCtaClass = cn(
  "inline-flex shrink-0 items-center rounded-full px-3 py-1.5",
  "text-[13px] font-medium leading-tight text-white",
  "bg-brand-primary border border-brand-primary/90",
  "shadow-[0_1px_6px_rgba(131,176,218,0.22)]",
  "transition-all duration-150 ease-out",
  "hover:bg-brand-primary/93 hover:shadow-[0_2px_8px_rgba(131,176,218,0.28)]",
  "active:scale-[0.98] touch-manipulation",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-1",
);

const metricPillClass = cn(
  "shrink-0 inline-flex items-center rounded-full px-2.5 py-1",
  "text-[12px] font-medium leading-tight text-brand-primary/80",
  "bg-brand-primary/6 ring-1 ring-brand-primary/12",
  "hover:bg-brand-primary/10 hover:text-brand-primary",
  "transition-colors duration-150 touch-manipulation active:opacity-80",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
);

export function CommunityPrayerEngagement({
  postId,
  initialCounts,
  initialMyReactions,
  initialCommentCount,
  initialVoiceResponseCount = 0,
  allowReactions = true,
  allowComments = true,
  preset,
  returnPath,
  allowVoicePrayer = false,
  spaceType,
  spaceSlug,
  className,
}: {
  postId: string;
  initialCounts: ReactionCounts;
  initialMyReactions: CommunityReactionType[];
  initialCommentCount: number;
  initialVoiceResponseCount?: number;
  allowReactions?: boolean;
  allowComments?: boolean;
  preset: SpaceInteractionPreset;
  returnPath: string;
  allowVoicePrayer?: boolean;
  spaceType?: string;
  spaceSlug?: string;
  className?: string;
}) {
  const [counts, setCounts] = useState(initialCounts);
  const [isPraying, setIsPraying] = useState(
    () => initialMyReactions.includes(PRAYING_REACTION_TYPE),
  );
  const [responseCount, setResponseCount] = useState(initialCommentCount);
  const [voiceResponseCount, setVoiceResponseCount] = useState(initialVoiceResponseCount);
  const [countPulse, setCountPulse] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);
  const [threadRefreshKey, setThreadRefreshKey] = useState(0);
  const [successToast, setSuccessToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const metrics = useMemo(
    () =>
      derivePostPrayerEngagementMetrics({
        reactionCounts: counts,
        commentCount: responseCount,
        voiceResponseCount,
      }),
    [counts, responseCount, voiceResponseCount],
  );

  useEffect(() => {
    setResponseCount(initialCommentCount);
  }, [initialCommentCount]);

  useEffect(() => {
    setVoiceResponseCount(initialVoiceResponseCount);
  }, [initialVoiceResponseCount]);

  useEffect(() => {
    setIsPraying(initialMyReactions.includes(PRAYING_REACTION_TYPE));
  }, [initialMyReactions]);

  useEffect(() => {
    if (!successToast) return;
    const id = window.setTimeout(() => setSuccessToast(false), 3200);
    return () => window.clearTimeout(id);
  }, [successToast]);

  function togglePraying() {
    setError(null);
    setIsPraying((v) => !v);
    startTransition(async () => {
      const res = await toggleCommunityPostReactionAction(
        postId,
        PRAYING_REACTION_TYPE,
      );
      if (!res.ok) {
        setError(res.error);
        setIsPraying(initialMyReactions.includes(PRAYING_REACTION_TYPE));
        return;
      }
      setCounts(res.counts);
      setIsPraying(res.myReactions.includes(PRAYING_REACTION_TYPE));
    });
  }

  function handlePrayerShared(commentCount: number) {
    setResponseCount(commentCount);
    setThreadRefreshKey((k) => k + 1);
    setCountPulse(true);
    window.setTimeout(() => setCountPulse(false), 700);
    setSuccessToast(true);
    setComposerOpen(false);
  }

  const shareLabel = preset.comments.emptyCta;
  const responsesLabel = formatResponsesLabel(metrics.responseCount);
  const voicePrayersLabel = formatVoicePrayersLabel(metrics.voiceResponseCount);
  const threadAriaLabel = responsesThreadAriaLabel(metrics.responseCount);

  if (!allowReactions && !allowComments) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {allowReactions ? (
            <CommunityPrayingButton
              count={metrics.peoplePrayingCount}
              active={isPraying}
              disabled={isPending}
              onToggle={togglePraying}
              showCount={metrics.peoplePrayingCount > 0}
              peoplePrayingLabel
            />
          ) : null}

          {allowComments ? (
            <button type="button" onClick={() => setComposerOpen(true)} className={shareCtaClass}>
              {shareLabel}
            </button>
          ) : null}
        </div>

        {allowComments ? (
          <div className="flex shrink-0 items-center gap-1.5">
            {voicePrayersLabel ? (
              <span className={cn(metricPillClass, "cursor-default")} aria-label={voicePrayersLabel}>
                {voicePrayersLabel}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setThreadOpen(true)}
              aria-label={threadAriaLabel}
              className={cn(metricPillClass, countPulse && "text-brand-primary ring-brand-primary/25")}
            >
              {responsesLabel}
            </button>
          </div>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <CommunityPrayerComposerSheet
        open={composerOpen}
        onOpenChange={setComposerOpen}
        postId={postId}
        preset={preset}
        returnPath={returnPath}
        allowVoice={allowVoicePrayer}
        onPrayerShared={handlePrayerShared}
      />

      <CommunityPrayerThreadSheet
        open={threadOpen}
        onOpenChange={setThreadOpen}
        postId={postId}
        preset={preset}
        returnPath={returnPath}
        prayerCount={responseCount}
        refreshKey={threadRefreshKey}
        onCommentCountChange={setResponseCount}
        onResponseMetricsChange={({ commentCount, voiceResponseCount: voiceCount }) => {
          setResponseCount(commentCount);
          setVoiceResponseCount(voiceCount);
        }}
        onRequestSharePrayer={() => {
          setThreadOpen(false);
          setComposerOpen(true);
        }}
        allowComments={allowComments}
        spaceType={spaceType}
        spaceSlug={spaceSlug}
      />

      <CommunityPrayerToast
        message={preset.comments.submitSuccess}
        visible={successToast}
      />
    </div>
  );
}

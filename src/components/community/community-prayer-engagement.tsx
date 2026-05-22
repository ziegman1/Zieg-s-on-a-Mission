"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleCommunityPostReactionAction } from "@/app/(storefront)/community/reaction-actions";
import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import { prayerThreadButtonLabel } from "@/lib/community/prayer-thread-copy";
import type { CommunityReactionType, ReactionCounts } from "@/lib/community/types";
import { CommunityPrayerComposerSheet } from "./community-prayer-composer-sheet";
import { CommunityPrayerThreadSheet } from "./community-prayer-thread-sheet";
import { CommunityPrayerToast } from "./community-prayer-toast";
import { CommunityPrayerWarmthStrip } from "./community-prayer-warmth-strip";
import {
  CommunityPrayingButton,
  PRAYING_REACTION_TYPE,
} from "./community-praying-button";
import { cn } from "@/lib/utils";

export function CommunityPrayerEngagement({
  postId,
  initialCounts,
  initialMyReactions,
  initialCommentCount,
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
  const [prayerCount, setPrayerCount] = useState(initialCommentCount);
  const [countPulse, setCountPulse] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);
  const [threadRefreshKey, setThreadRefreshKey] = useState(0);
  const [successToast, setSuccessToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const prayingCount = counts.prayed ?? 0;

  useEffect(() => {
    setPrayerCount(initialCommentCount);
  }, [initialCommentCount]);

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
    setPrayerCount(commentCount);
    setThreadRefreshKey((k) => k + 1);
    setCountPulse(true);
    window.setTimeout(() => setCountPulse(false), 700);
    setSuccessToast(true);
    setComposerOpen(false);
  }

  const threadLabel = prayerThreadButtonLabel(prayerCount, preset.comments);
  const showWarmth = prayingCount > 0 || prayerCount > 0;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {allowReactions ? (
        <CommunityPrayingButton
          count={prayingCount}
          active={isPraying}
          disabled={isPending}
          onToggle={togglePraying}
        />
      ) : null}

      {allowComments ? (
        <div className={cn("flex flex-col gap-1.5", !allowReactions && "mt-0")}>
          <div className="space-y-1">
            {showWarmth ? (
              <CommunityPrayerWarmthStrip
                prayingCount={prayingCount}
                prayerResponseCount={prayerCount}
                compact
              />
            ) : null}

            <button
              type="button"
              onClick={() => setThreadOpen(true)}
              className={cn(
                "inline-flex w-full min-h-[2.125rem] items-center justify-center gap-1.5 rounded-full px-3.5",
                "text-[13px] font-medium text-brand-primary/85",
                "bg-white/60 ring-1 ring-brand-primary/12",
                "transition-all duration-150 ease-out",
                "hover:bg-brand-primary/[0.06] active:scale-[0.98] touch-manipulation",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
                countPulse && "ring-brand-primary/25 bg-brand-primary/[0.05]",
              )}
            >
              <span aria-hidden>🙏</span>
              <span>{threadLabel}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className={cn(
              "inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4",
              "min-h-[2.35rem] text-[14px] font-medium text-white",
              "bg-brand-primary border border-brand-primary/90",
              "shadow-[0_2px_10px_rgba(131,176,218,0.32)]",
              "transition-all duration-150 ease-out",
              "hover:bg-brand-primary/93 hover:shadow-[0_3px_14px_rgba(131,176,218,0.36)]",
              "active:scale-[0.98] touch-manipulation",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-1",
            )}
          >
            <span aria-hidden>🙏</span>
            <span>{preset.comments.emptyCta}</span>
          </button>
        </div>
      ) : null}

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
        prayerCount={prayerCount}
        refreshKey={threadRefreshKey}
        onCommentCountChange={setPrayerCount}
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

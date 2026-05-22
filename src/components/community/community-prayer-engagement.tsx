"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleCommunityPostReactionAction } from "@/app/(storefront)/community/reaction-actions";
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

  const shareLabel = preset.comments.emptyCta;
  const threadAriaLabel =
    prayerCount === 0
      ? "View prayers — none shared yet"
      : `View ${prayerCount} ${prayerCount === 1 ? "prayer" : "prayers"}`;

  if (!allowReactions && !allowComments) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {allowReactions ? (
            <CommunityPrayingButton
              count={prayingCount}
              active={isPraying}
              disabled={isPending}
              onToggle={togglePraying}
            />
          ) : null}

          {allowComments ? (
            <button type="button" onClick={() => setComposerOpen(true)} className={shareCtaClass}>
              {shareLabel}
            </button>
          ) : null}
        </div>

        {allowComments ? (
          <button
            type="button"
            onClick={() => setThreadOpen(true)}
            aria-label={threadAriaLabel}
            className={cn(
              "shrink-0 inline-flex items-center gap-0.5 py-1 pl-1 min-h-[2rem] min-w-[2rem] justify-center",
              "text-brand-primary/70 hover:text-brand-primary",
              "transition-colors duration-150 touch-manipulation active:opacity-80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 rounded-md",
              countPulse && "text-brand-primary",
            )}
          >
            <span className="text-[15px] leading-none" aria-hidden>
              🙏
            </span>
            <span className="tabular-nums text-[13px] font-semibold leading-none">
              {prayerCount}
            </span>
          </button>
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

"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleCommunityPostReactionAction } from "@/app/(storefront)/community/reaction-actions";
import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import {
  prayerThreadButtonLabel,
  prayerThreadSummaryLabel,
} from "@/lib/community/prayer-thread-copy";
import type { CommunityReactionType, ReactionCounts } from "@/lib/community/types";
import { CommunityPrayerComposerSheet } from "./community-prayer-composer-sheet";
import { CommunityPrayerThreadSheet } from "./community-prayer-thread-sheet";
import { CommunityPrayerToast } from "./community-prayer-toast";
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
  const [myReactions, setMyReactions] = useState<Set<CommunityReactionType>>(
    () => new Set(initialMyReactions),
  );
  const [prayerCount, setPrayerCount] = useState(initialCommentCount);
  const [countPulse, setCountPulse] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [threadOpen, setThreadOpen] = useState(false);
  const [threadRefreshKey, setThreadRefreshKey] = useState(0);
  const [successToast, setSuccessToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setPrayerCount(initialCommentCount);
  }, [initialCommentCount]);

  useEffect(() => {
    if (!successToast) return;
    const id = window.setTimeout(() => setSuccessToast(false), 3200);
    return () => window.clearTimeout(id);
  }, [successToast]);

  function toggle(type: CommunityReactionType) {
    setError(null);
    startTransition(async () => {
      const res = await toggleCommunityPostReactionAction(postId, type);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCounts(res.counts);
      setMyReactions(new Set(res.myReactions));
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

  const reactionPillBase = cn(
    "inline-flex items-center gap-1.5 rounded-full min-h-[2.25rem] px-3",
    "text-xs font-medium border transition-all duration-150",
    "bg-white/85 text-brand-ink/72 border-black/[0.05]",
    "hover:bg-white hover:border-brand-primary/15 hover:text-brand-ink",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
    "active:scale-[0.97]",
  );

  const threadLabel = prayerThreadButtonLabel(prayerCount, preset.comments);
  const threadSummary = prayerThreadSummaryLabel(prayerCount, preset.comments);

  return (
    <div className={className}>
      {allowReactions ? (
        <div
          className="flex flex-wrap items-center gap-1.5 sm:gap-2"
          role="group"
          aria-label="Prayer reactions"
        >
          {preset.reactions.map(({ type, label, Icon }) => {
            const active = myReactions.has(type);
            const count = counts[type] ?? 0;
            return (
              <button
                key={type}
                type="button"
                disabled={isPending}
                onClick={() => toggle(type)}
                aria-pressed={active}
                className={cn(
                  reactionPillBase,
                  active &&
                    "bg-brand-primary/88 text-white border-brand-primary/90 shadow-sm",
                  isPending && "opacity-60",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span>{label}</span>
                {count > 0 ? (
                  <span
                    className={cn(
                      "tabular-nums text-[11px]",
                      active ? "text-white/90" : "text-brand-ink/45",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      {allowComments ? (
        <div
          className={cn(
            "mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3",
            !allowReactions && "mt-0",
          )}
        >
          <button
            type="button"
            onClick={() => setThreadOpen(true)}
            className={cn(
              "inline-flex min-h-[2.5rem] w-full items-center justify-center gap-2 rounded-full px-4",
              "text-sm font-medium text-brand-primary bg-brand-primary/[0.07]",
              "ring-1 ring-brand-primary/20 transition-all duration-200",
              "hover:bg-brand-primary/12 hover:ring-brand-primary/30",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40",
              "sm:w-auto sm:justify-start",
              countPulse && "scale-[1.02] ring-brand-primary/35",
            )}
          >
            <span aria-hidden>🙏</span>
            <span className={cn(countPulse && "animate-pulse")}>{threadLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5",
              "min-h-[2.875rem] text-[15px] font-semibold text-white",
              "bg-brand-primary border-2 border-brand-primary/90",
              "shadow-[0_4px_14px_rgba(131,176,218,0.45)]",
              "transition-all duration-200 hover:-translate-y-0.5",
              "hover:bg-brand-primary/92 hover:shadow-[0_6px_20px_rgba(131,176,218,0.5)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45 focus-visible:ring-offset-2",
              "sm:w-auto sm:min-w-[11.5rem]",
            )}
          >
            <span aria-hidden>🙏</span>
            <span>{preset.comments.emptyCta}</span>
          </button>
        </div>
      ) : null}

      {allowComments ? (
        <p className="mt-2 text-center text-xs text-brand-ink/45 sm:text-left">
          {threadSummary}
        </p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

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
        onRequestSharePrayer={() => setComposerOpen(true)}
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

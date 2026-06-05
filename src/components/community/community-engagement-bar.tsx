"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  createCommentActivateGestureState,
  handleCommentActivateClick,
  handleCommentActivatePointerDown,
} from "@/lib/community/comment-activate-gesture";
import { MessageCircle } from "lucide-react";
import {
  setCommunityPostReactionAction,
  toggleCommunityPostReactionAction,
} from "@/app/(storefront)/community/reaction-actions";
import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import { getSpaceInteractionPreset } from "@/lib/community/space-interaction";
import {
  STANDARD_REACTION_ORDER,
} from "@/lib/community/reaction-display";
import type { CommunityReactionType } from "@/lib/community/types";
import type { ReactionCounts } from "@/lib/community/types";
import {
  CommunityPrayingButton,
  PRAYING_REACTION_TYPE,
} from "./community-praying-button";
import { CommunityReactionPicker } from "./community-reaction-picker";
import { CommunityReactionSummary } from "./community-reaction-summary";
import { cn } from "@/lib/utils";

function activeStandardReaction(
  myReactions: Set<CommunityReactionType>,
): CommunityReactionType | null {
  for (const type of STANDARD_REACTION_ORDER) {
    if (myReactions.has(type)) return type;
  }
  return null;
}

function applyOptimisticStandardReaction(
  counts: ReactionCounts,
  prev: CommunityReactionType | null,
  next: CommunityReactionType,
): { counts: ReactionCounts; active: CommunityReactionType | null } {
  const nextCounts = { ...counts };
  if (prev) {
    nextCounts[prev] = Math.max(0, (nextCounts[prev] ?? 0) - 1);
  }
  if (prev === next) {
    return { counts: nextCounts, active: null };
  }
  nextCounts[next] = (nextCounts[next] ?? 0) + 1;
  return { counts: nextCounts, active: next };
}

export function CommunityEngagementBar({
  postId,
  initialCounts,
  initialMyReactions,
  commentCount,
  commentsOpen,
  onCommentsToggle,
  onCommentsActivate,
  allowReactions = true,
  allowComments = true,
  interactionPreset,
  spaceType,
  spaceSlug,
  className,
  compact = false,
}: {
  postId: string;
  initialCounts: ReactionCounts;
  initialMyReactions: CommunityReactionType[];
  commentCount: number;
  commentsOpen: boolean;
  /** Close comments (prayer-space toggle only — not used by the default Comment pill). */
  onCommentsToggle: () => void;
  /** Open comments from pointerdown — keeps iOS keyboard in the user-gesture window. */
  onCommentsActivate?: () => void;
  allowReactions?: boolean;
  allowComments?: boolean;
  interactionPreset?: SpaceInteractionPreset;
  spaceType?: string;
  spaceSlug?: string;
  className?: string;
  compact?: boolean;
}) {
  const preset = interactionPreset ?? getSpaceInteractionPreset(spaceType, spaceSlug);
  const isPrayer = preset.mode === "prayer";
  const { comments: copy } = preset;

  const [counts, setCounts] = useState(initialCounts);
  const [myReactions, setMyReactions] = useState<Set<CommunityReactionType>>(
    () => new Set(initialMyReactions),
  );
  const activeReaction = useMemo(
    () => activeStandardReaction(myReactions),
    [myReactions],
  );
  const [isPraying, setIsPraying] = useState(
    () => initialMyReactions.includes(PRAYING_REACTION_TYPE),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const snapshot = useMemo(
    () => ({ counts: initialCounts, my: new Set(initialMyReactions) }),
    [initialCounts, initialMyReactions],
  );

  useEffect(() => {
    setCounts(initialCounts);
    setMyReactions(new Set(initialMyReactions));
    setIsPraying(initialMyReactions.includes(PRAYING_REACTION_TYPE));
  }, [initialCounts, initialMyReactions]);

  function setStandardReaction(type: CommunityReactionType) {
    setError(null);
    const prev = activeStandardReaction(myReactions);
    const optimistic = applyOptimisticStandardReaction(counts, prev, type);
    setCounts(optimistic.counts);
    setMyReactions(optimistic.active ? new Set([optimistic.active]) : new Set());

    startTransition(async () => {
      const res = await setCommunityPostReactionAction(postId, type);
      if (!res.ok) {
        setError(res.error);
        setCounts(snapshot.counts);
        setMyReactions(snapshot.my);
        return;
      }
      setCounts(res.counts);
      setMyReactions(new Set(res.myReactions));
    });
  }

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

  const reactionPillBase = cn(
    "inline-flex items-center gap-1.5 rounded-full min-h-[2.25rem] px-3",
    "text-xs font-medium border transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
    "active:scale-[0.97]",
    compact && "min-h-[2rem] px-2.5 text-[11px]",
    "bg-white/80 text-brand-ink/70 border-black/[0.06] hover:bg-white hover:border-brand-primary/20 hover:text-brand-ink",
  );

  const countLabel =
    commentCount === 1 ? `1 ${copy.countSingular}` : `${commentCount} ${copy.countPlural}`;

  const prayingButton = allowReactions && isPrayer && (
    <CommunityPrayingButton
      count={counts.prayed ?? 0}
      active={isPraying}
      disabled={isPending}
      onToggle={togglePraying}
    />
  );

  const commentGestureRef = useRef(createCommentActivateGestureState());

  const commentButtonHandlers = {
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      handleCommentActivatePointerDown(
        commentGestureRef.current,
        commentsOpen,
        () => e.preventDefault(),
        () => onCommentsActivate?.(),
      );
    },
    onClick: () => {
      handleCommentActivateClick(commentGestureRef.current, () => onCommentsActivate?.());
    },
  };

  const defaultCommentPill = allowComments && !isPrayer && (
    <button
      type="button"
      {...commentButtonHandlers}
      aria-expanded={commentsOpen}
      className={cn(
        reactionPillBase,
        "ml-auto",
        commentsOpen && "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
      )}
    >
      <MessageCircle className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
      <span>{copy.toggleLabel}</span>
      <span className="tabular-nums text-[11px] opacity-80">{countLabel}</span>
    </button>
  );

  const prayerShareCta = allowComments && isPrayer && (
    <button
      type="button"
      onClick={onCommentsToggle}
      aria-expanded={commentsOpen}
      aria-controls={commentsOpen ? `post-prayers-${postId}` : undefined}
      className={cn(
        "inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4",
        "text-[14px] font-medium transition-all duration-150 ease-out touch-manipulation",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2",
        "active:scale-[0.98]",
        compact ? "min-h-[2.35rem] text-[13px]" : "min-h-[2.45rem]",
        commentsOpen
          ? "bg-brand-primary/12 text-brand-primary ring-1 ring-brand-primary/30"
          : "bg-brand-primary text-white shadow-[0_3px_12px_rgba(131,176,218,0.38)] hover:bg-brand-primary/93",
        "sm:w-auto sm:min-w-[10.5rem]",
      )}
    >
      <span aria-hidden>🙏</span>
      <span>{commentsOpen ? copy.toggleLabelOpen : copy.emptyCta}</span>
    </button>
  );

  return (
    <div className={className}>
      {isPrayer ? (
        <div className="flex flex-col gap-1.5">
          {prayingButton}
          {allowComments ? prayerShareCta : null}
        </div>
      ) : (
        <div className="space-y-1.5">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Post reactions"
          >
            {allowReactions ? (
              <CommunityReactionPicker
                activeReaction={activeReaction}
                disabled={isPending}
                onSelect={setStandardReaction}
              />
            ) : null}
            {defaultCommentPill}
          </div>
          {allowReactions ? (
            <CommunityReactionSummary postId={postId} counts={counts} />
          ) : null}
        </div>
      )}
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

/** Design preview only — reactions not wired */
export function CommunityEngagementBarPreview({
  className,
  compact = false,
  spaceType,
}: {
  className?: string;
  compact?: boolean;
  spaceType?: string;
}) {
  const preset = getSpaceInteractionPreset(spaceType);
  const isPrayer = preset.mode === "prayer";
  const pillBase = cn(
    "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-brand-ink/40",
    "bg-white/60 border border-dashed border-black/[0.08]",
    compact && "text-[11px] px-2 py-1",
  );

  if (isPrayer) {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <span
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium",
            "bg-white/70 text-brand-ink/50 border border-dashed border-black/[0.08]",
          )}
        >
          <span aria-hidden>🙏</span>
          <span>Praying</span>
        </span>
        <span
          className={cn(
            "inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium",
            "bg-white/60 text-brand-primary/70 ring-1 ring-brand-primary/12",
          )}
        >
          <span aria-hidden>🙏</span>
          {preset.comments.threadInvite}
        </span>
        <span
          className={cn(
            "inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white",
            compact && "min-h-[2.35rem]",
          )}
        >
          <span aria-hidden>🙏</span>
          {preset.comments.emptyCta}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)} role="group">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={pillBase}>
          <span>React</span>
        </span>
        <span className={cn(pillBase, "ml-auto")}>
          <MessageCircle className="h-3.5 w-3.5" aria-hidden />
          <span>Comment</span>
        </span>
      </div>
      <p className="text-xs text-brand-ink/35">👍 4 · ❤️ 2</p>
    </div>
  );
}

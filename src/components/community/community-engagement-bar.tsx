"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { toggleCommunityPostReactionAction } from "@/app/(storefront)/community/reaction-actions";
import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import { getSpaceInteractionPreset } from "@/lib/community/space-interaction";
import type { CommunityReactionType } from "@/lib/community/types";
import type { ReactionCounts } from "@/lib/community/types";
import {
  CommunityPrayingButton,
  PRAYING_REACTION_TYPE,
} from "./community-praying-button";
import { cn } from "@/lib/utils";

export function CommunityEngagementBar({
  postId,
  initialCounts,
  initialMyReactions,
  commentCount,
  commentsOpen,
  onCommentsToggle,
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
  onCommentsToggle: () => void;
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
  const [isPraying, setIsPraying] = useState(
    () => initialMyReactions.includes(PRAYING_REACTION_TYPE),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(type: CommunityReactionType) {
    setError(null);
    setMyReactions((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
    startTransition(async () => {
      const res = await toggleCommunityPostReactionAction(postId, type);
      if (!res.ok) {
        setError(res.error);
        setMyReactions(new Set(initialMyReactions));
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
    !isPrayer &&
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

  const reactionButtons =
    allowReactions &&
    !isPrayer &&
    preset.reactions.map(({ type, label, Icon }) => {
      const active = myReactions.has(type);
      const count = counts[type] ?? 0;
      return (
        <button
          key={type}
          type="button"
          disabled={isPending}
          onClick={() => toggle(type)}
          title={active ? `Remove ${label}` : label}
          aria-pressed={active}
          className={cn(
            reactionPillBase,
            active && "bg-brand-primary text-white border-brand-primary shadow-sm",
            isPending && "opacity-60",
          )}
        >
          <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
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
    });

  const defaultCommentPill = allowComments && !isPrayer && (
    <button
      type="button"
      onClick={onCommentsToggle}
      aria-expanded={commentsOpen}
      className={cn(
        reactionPillBase,
        "ml-auto",
        commentsOpen && "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
      )}
    >
      <MessageCircle className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
      <span>{commentsOpen ? copy.toggleLabelOpen : copy.toggleLabel}</span>
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
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Post reactions"
        >
          {reactionButtons}
          {defaultCommentPill}
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
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} role="group">
      {preset.reactions.map(({ type, label, Icon }) => (
        <span key={type} className={pillBase}>
          <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
          <span>{label}</span>
          <span className="tabular-nums opacity-60">0</span>
        </span>
      ))}
    </div>
  );
}

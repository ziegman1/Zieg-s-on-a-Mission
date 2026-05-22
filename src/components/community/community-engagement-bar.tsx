"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { toggleCommunityPostReactionAction } from "@/app/(storefront)/community/reaction-actions";
import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import { getSpaceInteractionPreset } from "@/lib/community/space-interaction";
import type { CommunityReactionType } from "@/lib/community/types";
import type { ReactionCounts } from "@/lib/community/types";
import { cn } from "@/lib/utils";

function prayerCountMicrocopy(
  count: number,
  copy: SpaceInteractionPreset["comments"],
): string {
  if (count === 0) return "Be the first to pray";
  if (count === 1) return `1 ${copy.countSingular}`;
  return `${count} ${copy.countPlural}`;
}

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
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const reactionPillBase = cn(
    "inline-flex items-center gap-1.5 rounded-full min-h-[2.25rem] px-3",
    "text-xs font-medium border transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
    "active:scale-[0.97]",
    compact && "min-h-[2rem] px-2.5 text-[11px]",
    isPrayer &&
      "bg-white/85 text-brand-ink/72 border-black/[0.05] hover:bg-white hover:border-brand-primary/15 hover:text-brand-ink",
    !isPrayer &&
      "bg-white/80 text-brand-ink/70 border-black/[0.06] hover:bg-white hover:border-brand-primary/20 hover:text-brand-ink",
  );

  const countLabel =
    commentCount === 1 ? `1 ${copy.countSingular}` : `${commentCount} ${copy.countPlural}`;

  const reactionButtons =
    allowReactions &&
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
            active &&
              (isPrayer
                ? "bg-brand-primary/88 text-white border-brand-primary/90 shadow-sm"
                : "bg-brand-primary text-white border-brand-primary shadow-sm"),
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
    <div
      className={cn(
        "flex w-full flex-col gap-1.5 sm:w-auto sm:min-w-[11.5rem] sm:items-end",
        compact && "sm:min-w-[10rem]",
      )}
    >
      <button
        type="button"
        onClick={onCommentsToggle}
        aria-expanded={commentsOpen}
        aria-controls={commentsOpen ? `post-prayers-${postId}` : undefined}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5",
          "text-sm font-semibold tracking-wide transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/45 focus-visible:ring-offset-2",
          "active:scale-[0.98]",
          compact ? "min-h-[2.5rem] px-4 text-[13px]" : "min-h-[2.875rem] text-[15px]",
          commentsOpen
            ? "bg-brand-primary/12 text-brand-primary border-2 border-brand-primary/35 shadow-sm hover:bg-brand-primary/18"
            : cn(
                "bg-brand-primary text-white border-2 border-brand-primary/90",
                "shadow-[0_4px_14px_rgba(131,176,218,0.45)]",
                "hover:bg-brand-primary/92 hover:border-brand-primary hover:shadow-[0_6px_20px_rgba(131,176,218,0.5)] hover:-translate-y-0.5",
              ),
        )}
      >
        <span aria-hidden className="text-base leading-none">
          🙏
        </span>
        <span>{commentsOpen ? copy.toggleLabelOpen : copy.emptyCta}</span>
      </button>
      <p
        className={cn(
          "text-center text-xs leading-snug sm:text-right",
          commentCount === 0 ? "text-brand-ink/55 font-medium" : "text-brand-ink/45",
        )}
      >
        {prayerCountMicrocopy(commentCount, copy)}
      </p>
    </div>
  );

  return (
    <div className={className}>
      {isPrayer ? (
        <div
          className={cn(
            "flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
          )}
        >
          {allowReactions ? (
            <div
              className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:gap-2"
              role="group"
              aria-label="Prayer reactions"
            >
              {reactionButtons}
            </div>
          ) : null}
          {allowReactions && allowComments ? (
            <div
              className="hidden h-9 w-px shrink-0 bg-black/[0.08] sm:block"
              aria-hidden
            />
          ) : null}
          {allowComments ? (
            <>
              <div
                className={cn(
                  "h-px w-full bg-black/[0.06] sm:hidden",
                  !allowReactions && "hidden",
                )}
                aria-hidden
              />
              {prayerShareCta}
            </>
          ) : null}
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
      <div
        className={cn(
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5" role="group">
          {preset.reactions.map(({ type, label, Icon }) => (
            <span key={type} className={pillBase}>
              <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} aria-hidden />
              <span>{label}</span>
              <span className="tabular-nums opacity-60">0</span>
            </span>
          ))}
        </div>
        <div className="hidden h-9 w-px bg-black/[0.08] sm:block" aria-hidden />
        <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:items-end">
          <span
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white",
              compact && "min-h-[2.5rem] text-[13px]",
            )}
          >
            <span aria-hidden>🙏</span>
            <span>{preset.comments.emptyCta}</span>
          </span>
          <span className="text-center text-xs text-brand-ink/55 sm:text-right">
            Be the first to pray
          </span>
        </div>
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

"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { listCommunityPostReactionsAction } from "@/app/(storefront)/community/reaction-actions";
import type { PostReactionDetail } from "@/lib/community/reactions";
import {
  activeReactionTypes,
  REACTION_EMOJI,
  REACTION_LABEL,
  totalReactionCount,
} from "@/lib/community/reaction-display";
import type { CommunityReactionType, ReactionCounts } from "@/lib/community/types";
import { CommunityBottomSheet } from "./community-bottom-sheet";
import { cn } from "@/lib/utils";

export function CommunityReactionSummary({
  postId,
  counts,
  className,
}: {
  postId: string;
  counts: ReactionCounts;
  className?: string;
}) {
  const total = totalReactionCount(counts);
  const types = activeReactionTypes(counts);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PostReactionDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const loadDetails = useCallback(() => {
    setLoading(true);
    setError(null);
    startTransition(async () => {
      const res = await listCommunityPostReactionsAction(postId);
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setItems(res.items);
    });
  }, [postId]);

  useEffect(() => {
    if (!open) return;
    loadDetails();
  }, [open, loadDetails]);

  if (total === 0) return null;

  const compactSummary =
    types.length >= 3 ? (
      <span>{total} reactions</span>
    ) : (
      <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {types.map((type) => (
          <span key={type} className="inline-flex items-center gap-0.5 tabular-nums">
            <span aria-hidden>{REACTION_EMOJI[type]}</span>
            <span>{counts[type]}</span>
          </span>
        ))}
      </span>
    );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "text-left text-xs text-brand-ink/50 hover:text-brand-primary",
          "transition-colors duration-150 touch-manipulation",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 rounded-sm",
          className,
        )}
        aria-label={`${total} reactions — view details`}
      >
        {compactSummary}
      </button>

      <CommunityBottomSheet
        open={open}
        onOpenChange={setOpen}
        title="Reactions"
        description={`${total} ${total === 1 ? "reaction" : "reactions"}`}
        className="max-h-[min(70dvh,28rem)]"
      >
        {loading ? (
          <div className="flex justify-center py-10 text-brand-ink/40">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          </div>
        ) : error ? (
          <p className="py-6 text-center text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-brand-ink/50">No reactions yet.</p>
        ) : (
          <ul className="divide-y divide-black/[0.05] -mx-1">
            {items.map((item, i) => (
              <li
                key={`${item.displayName}-${item.reactionType}-${item.createdAt}-${i}`}
                className="flex items-center gap-3 px-1 py-2.5"
              >
                <span className="text-lg leading-none" aria-hidden>
                  {REACTION_EMOJI[item.reactionType]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-ink truncate">
                    {item.displayName}
                  </p>
                  <p className="text-xs text-brand-ink/45">{REACTION_LABEL[item.reactionType]}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CommunityBottomSheet>
    </>
  );
}

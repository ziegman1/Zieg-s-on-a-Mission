"use client";

import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import type { CommunityPostCommentThread } from "@/lib/community/types";
import { CommunityCommentItem } from "./community-comment-item";
import type { CommentModerationResult } from "./community-comment-moderation-menu";
import { cn } from "@/lib/utils";

export function CommunityCommentList({
  threads,
  canComment,
  onReply,
  preset,
  prayerThreadLayout = false,
  canModerate = false,
  onModerated,
}: {
  threads: CommunityPostCommentThread[];
  canComment: boolean;
  onReply?: (parentCommentId: string, body: string) => Promise<void>;
  preset: SpaceInteractionPreset;
  /** Compact communal wall layout for prayer thread sheet */
  prayerThreadLayout?: boolean;
  canModerate?: boolean;
  onModerated?: (result: CommentModerationResult) => void;
}) {
  const isPrayer = preset.mode === "prayer";

  if (threads.length === 0) {
    return (
      <div
        className={cn(
          "py-6 px-4 text-center rounded-xl",
          isPrayer ? "bg-brand-primary/[0.04] ring-1 ring-brand-primary/10" : "",
        )}
      >
        <p className="text-sm font-medium text-brand-ink/75">{preset.comments.emptyTitle}</p>
        <p className="mt-1.5 text-sm text-brand-ink/55 leading-relaxed max-w-sm mx-auto">
          {preset.comments.emptyBody}
        </p>
      </div>
    );
  }

  return (
    <ul
      className={cn(
        "divide-y divide-black/[0.04]",
        prayerThreadLayout && "rounded-2xl bg-brand-surface/30 ring-1 ring-black/[0.04] overflow-clip",
      )}
      aria-label={preset.comments.sectionLabel}
    >
      {threads.map(({ comment, replies }, index) => (
        <li
          key={comment.id}
          className={cn(
            prayerThreadLayout ? "px-3.5 py-3.5 first:pt-4 last:pb-4" : "py-3 first:pt-0",
            !prayerThreadLayout && index > 0 && "border-t border-black/[0.04]",
          )}
        >
          <CommunityCommentItem
            comment={comment}
            canReply={canComment}
            onReply={onReply}
            preset={preset}
            prayerThreadLayout={prayerThreadLayout}
            canModerate={canModerate}
            onModerated={onModerated}
          />
          {replies.length > 0 ? (
            <ul className="mt-2.5 space-y-2 border-l-2 border-brand-primary/15 pl-3 ml-1">
              {replies.map((reply) => (
                <li key={reply.id} className="pt-0.5">
                  <CommunityCommentItem
                    comment={reply}
                    isReply
                    canReply={false}
                    preset={preset}
                    prayerThreadLayout={prayerThreadLayout}
                    canModerate={canModerate}
                    onModerated={onModerated}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

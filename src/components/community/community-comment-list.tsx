"use client";

import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import type { CommunityPostCommentThread } from "@/lib/community/types";
import { CommunityCommentItem } from "./community-comment-item";
import { cn } from "@/lib/utils";

export function CommunityCommentList({
  threads,
  canComment,
  onReply,
  preset,
  prayerThreadLayout = false,
}: {
  threads: CommunityPostCommentThread[];
  canComment: boolean;
  onReply?: (parentCommentId: string, body: string) => Promise<void>;
  preset: SpaceInteractionPreset;
  /** Compact communal wall layout for prayer thread sheet */
  prayerThreadLayout?: boolean;
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
        "space-y-3",
        isPrayer && !prayerThreadLayout && "space-y-4",
        prayerThreadLayout && "space-y-3.5",
      )}
      aria-label={preset.comments.sectionLabel}
    >
      {threads.map(({ comment, replies }) => (
        <li key={comment.id} className="space-y-1">
          <CommunityCommentItem
            comment={comment}
            canReply={canComment}
            onReply={onReply}
            preset={preset}
            prayerThreadLayout={prayerThreadLayout}
          />
          {replies.length > 0 ? (
            <ul className="space-y-1">
              {replies.map((reply) => (
                <li key={reply.id}>
                  <CommunityCommentItem
                    comment={reply}
                    isReply
                    canReply={false}
                    preset={preset}
                    prayerThreadLayout={prayerThreadLayout}
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

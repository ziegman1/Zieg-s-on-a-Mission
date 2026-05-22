"use client";

import { useState } from "react";
import { formatCommunityPostDate } from "@/lib/community/format-post-date";
import { parsePrayerResponseBody } from "@/lib/community/prayer-response-body";
import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import type { CommunityPostComment } from "@/lib/community/types";
import { CommunityAvatar } from "./community-avatar";
import { CommunityReplyForm } from "./community-reply-form";
import { CommunityVoicePrayerPlayer } from "./community-voice-prayer-player";
import { cn } from "@/lib/utils";

export function CommunityCommentItem({
  comment,
  isReply = false,
  canReply,
  onReply,
  preset,
  prayerThreadLayout = false,
}: {
  comment: CommunityPostComment;
  isReply?: boolean;
  canReply: boolean;
  onReply?: (parentCommentId: string, body: string) => Promise<void>;
  preset: SpaceInteractionPreset;
  prayerThreadLayout?: boolean;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const parsed = parsePrayerResponseBody(comment.body);
  const isPrayer = preset.mode === "prayer";
  const firstName = comment.displayName.split(/\s+/)[0] ?? comment.displayName;
  const threadPrayer = isPrayer && prayerThreadLayout && !isReply;

  if (threadPrayer && parsed.kind === "voice") {
    return (
      <article className="rounded-2xl bg-white ring-1 ring-black/[0.05] px-3.5 py-3.5 space-y-2.5">
        <p className="text-sm font-semibold text-brand-ink">{comment.displayName}</p>
        <CommunityVoicePrayerPlayer
          audioUrl={parsed.audioUrl}
          durationSeconds={parsed.durationSeconds}
          showPlayLabel
        />
        <time dateTime={comment.createdAt} className="block text-xs text-brand-ink/45">
          {formatCommunityPostDate(comment.createdAt)}
        </time>
      </article>
    );
  }

  if (threadPrayer && parsed.kind === "written") {
    return (
      <article className="rounded-2xl bg-white ring-1 ring-black/[0.05] px-3.5 py-3.5 space-y-1.5">
        <p className="text-sm font-semibold text-brand-ink">{comment.displayName}</p>
        <p className="text-[15px] leading-relaxed text-brand-ink/85 whitespace-pre-wrap">
          &ldquo;{parsed.text}&rdquo;
        </p>
        <time dateTime={comment.createdAt} className="block text-xs text-brand-ink/45">
          {formatCommunityPostDate(comment.createdAt)}
        </time>
      </article>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-xl px-2 py-2.5 -mx-2",
        isPrayer && !isReply && !prayerThreadLayout && "bg-brand-primary/[0.03]",
        isReply && "ml-6 sm:ml-8 pt-2",
      )}
    >
      <CommunityAvatar
        name={comment.displayName}
        imageUrl={comment.profileImageUrl}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium text-brand-ink">{comment.displayName}</span>
          <span className="text-[11px] text-brand-ink/50">
            {parsed.kind === "voice" ? (
              <>
                {firstName} {preset.comments.voiceSharedTemplate}
              </>
            ) : isPrayer ? (
              <>
                {firstName} {preset.comments.actionVerb}:
              </>
            ) : (
              <>
                {firstName} {preset.comments.actionVerb}:
              </>
            )}
          </span>
          <time dateTime={comment.createdAt} className="text-[11px] text-brand-ink/38">
            {formatCommunityPostDate(comment.createdAt)}
          </time>
        </div>
        {parsed.kind === "voice" ? (
          <div className="mt-2">
            <CommunityVoicePrayerPlayer
              audioUrl={parsed.audioUrl}
              durationSeconds={parsed.durationSeconds}
            />
            {parsed.caption ? (
              <p className="mt-2 text-sm text-brand-ink/75 leading-relaxed">{parsed.caption}</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-1.5 text-sm text-brand-ink/82 leading-relaxed whitespace-pre-wrap">
            {parsed.kind === "written" ? parsed.text : ""}
          </p>
        )}
        {canReply && !isReply && onReply ? (
          <button
            type="button"
            onClick={() => setReplyOpen((v) => !v)}
            className="mt-2 text-xs font-medium text-brand-primary/90 hover:text-brand-primary hover:underline"
          >
            {replyOpen ? "Cancel" : preset.comments.replyVerb}
          </button>
        ) : null}
        {replyOpen && onReply ? (
          <CommunityReplyForm
            replyingToName={comment.displayName}
            onCancel={() => setReplyOpen(false)}
            onSubmit={(body) => onReply(comment.id, body)}
            preset={preset}
          />
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { formatCommunityPostDate } from "@/lib/community/format-post-date";
import { parsePrayerResponseBody } from "@/lib/community/prayer-response-body";
import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import type { CommunityPostComment } from "@/lib/community/types";
import { CommunityAvatar } from "./community-avatar";
import {
  CommunityCommentHiddenBadge,
  CommunityCommentModerationMenu,
  type CommentModerationResult,
} from "./community-comment-moderation-menu";
import { CommunityReplyForm } from "./community-reply-form";
import { CommunityVoicePrayerPlayer } from "./community-voice-prayer-player";
import { cn } from "@/lib/utils";

function CommentModerationHeader({
  comment,
  canModerate,
  onModerated,
  children,
  className,
}: {
  comment: CommunityPostComment;
  canModerate: boolean;
  onModerated?: (result: CommentModerationResult) => void;
  children: ReactNode;
  className?: string;
}) {
  const isHidden = comment.status === "hidden";

  return (
    <div className={cn("flex items-start justify-between gap-2", className)}>
      <div
        className={cn(
          "min-w-0 flex-1",
          isHidden && canModerate && "opacity-75",
        )}
      >
        {children}
      </div>
      {canModerate && onModerated ? (
        <div className="flex shrink-0 flex-col items-end gap-1">
          {isHidden ? <CommunityCommentHiddenBadge /> : null}
          <CommunityCommentModerationMenu
            comment={comment}
            onComplete={onModerated}
          />
        </div>
      ) : null}
    </div>
  );
}

export function CommunityCommentItem({
  comment,
  isReply = false,
  canReply,
  onReply,
  preset,
  prayerThreadLayout = false,
  canModerate = false,
  onModerated,
}: {
  comment: CommunityPostComment;
  isReply?: boolean;
  canReply: boolean;
  onReply?: (parentCommentId: string, body: string) => Promise<void>;
  preset: SpaceInteractionPreset;
  prayerThreadLayout?: boolean;
  /** ADMIN/STAFF only — server enforces on actions */
  canModerate?: boolean;
  onModerated?: (result: CommentModerationResult) => void;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const parsed = parsePrayerResponseBody(comment.body);
  const isPrayer = preset.mode === "prayer";
  const firstName = comment.displayName.split(/\s+/)[0] ?? comment.displayName;
  const threadPrayer = isPrayer && prayerThreadLayout && !isReply;
  const isHidden = comment.status === "hidden";

  if (threadPrayer && parsed.kind === "voice") {
    return (
      <article
        className={cn(
          "rounded-2xl bg-white ring-1 ring-black/[0.05] px-3.5 py-3.5 space-y-2.5",
          isHidden && canModerate && "ring-amber-200/70 bg-amber-50/30",
        )}
      >
        <CommentModerationHeader
          comment={comment}
          canModerate={canModerate}
          onModerated={onModerated}
        >
          <p className="text-sm font-semibold text-brand-ink">{comment.displayName}</p>
        </CommentModerationHeader>
        <CommunityVoicePrayerPlayer
          audioUrl={parsed.audioUrl}
          durationSeconds={parsed.durationSeconds}
          mimeType={parsed.mimeType}
          hasVideo={parsed.hasVideo}
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
      <article
        className={cn(
          "rounded-2xl bg-white ring-1 ring-black/[0.05] px-3.5 py-3.5 space-y-1.5",
          isHidden && canModerate && "ring-amber-200/70 bg-amber-50/30",
        )}
      >
        <CommentModerationHeader
          comment={comment}
          canModerate={canModerate}
          onModerated={onModerated}
        >
          <p className="text-sm font-semibold text-brand-ink">{comment.displayName}</p>
        </CommentModerationHeader>
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
        isHidden && canModerate && "bg-amber-50/40 ring-1 ring-amber-200/50",
      )}
    >
      <CommunityAvatar
        name={comment.displayName}
        imageUrl={comment.profileImageUrl}
        size="sm"
      />
      <div className="min-w-0 flex-1">
        <CommentModerationHeader
          comment={comment}
          canModerate={canModerate}
          onModerated={onModerated}
          className="mb-0"
        >
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
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
        </CommentModerationHeader>
        {parsed.kind === "voice" ? (
          <div className="mt-2">
            <CommunityVoicePrayerPlayer
              audioUrl={parsed.audioUrl}
              durationSeconds={parsed.durationSeconds}
              mimeType={parsed.mimeType}
              hasVideo={parsed.hasVideo}
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

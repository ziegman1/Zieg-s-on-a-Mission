"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import {
  createPostCommentAction,
  loadPostCommentsAction,
} from "@/app/(storefront)/community/comment-actions";
import {
  createVisitorMemberProfileAction,
  getCommentAuthorContextAction,
} from "@/app/(storefront)/community/member-actions";
import type { CommentAuthorContext, CommunityMemberProfile } from "@/lib/community/members";
import { allowVisitorOnlyComments } from "@/lib/community/members";
import { getSpaceInteractionPreset } from "@/lib/community/space-interaction";
import { canUseVoicePrayer } from "@/lib/community/voice-prayer";
import type { CommunityPostCommentThread } from "@/lib/community/types";
import { CommunityCommentForm } from "./community-comment-form";
import { CommunityCommentList } from "./community-comment-list";
import { CommunityJoinPrompt } from "./community-join-prompt";
import { CommunityMemberProfileForm } from "./community-member-profile-form";
import { CommunityPrayerResponseForm } from "./community-prayer-response-form";
import { cn } from "@/lib/utils";

export function CommunityComments({
  postId,
  returnPath = "/community",
  onCommentCountChange,
  commentPlaceholder = null,
  allowComments = true,
  allowVoiceMessages = false,
  spaceType,
  spaceSlug,
}: {
  postId: string;
  returnPath?: string;
  onCommentCountChange?: (count: number) => void;
  commentPlaceholder?: string | null;
  allowComments?: boolean;
  allowVoiceMessages?: boolean;
  spaceType?: string;
  spaceSlug?: string;
}) {
  const preset = getSpaceInteractionPreset(spaceType, spaceSlug);
  const isPrayer = preset.mode === "prayer";
  const voicePrayerEnabled = canUseVoicePrayer({
    spaceType,
    slug: spaceSlug,
    allowVoiceMessages,
  });

  const [threads, setThreads] = useState<CommunityPostCommentThread[] | null>(null);
  const [authorContext, setAuthorContext] = useState<CommentAuthorContext | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLoading, startLoad] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();

  const loadComments = useCallback(() => {
    startLoad(async () => {
      setLoadError(null);
      const res = await loadPostCommentsAction(postId);
      if (!res.ok) {
        setLoadError(res.error);
        setThreads([]);
        return;
      }
      setThreads(res.threads);
    });
  }, [postId]);

  useEffect(() => {
    loadComments();
    void getCommentAuthorContextAction().then(setAuthorContext);
  }, [loadComments]);

  function handleVisitorProfileCreated(member: CommunityMemberProfile) {
    setAuthorContext({ kind: "visitor", member });
    setActionError(null);
  }

  async function submitComment(body: string, parentCommentId?: string | null) {
    setActionError(null);
    const res = await createPostCommentAction({
      postId,
      body,
      parentCommentId: parentCommentId ?? null,
    });
    if (!res.ok) {
      setActionError(res.error);
      throw new Error(res.error);
    }
    setThreads(res.threads);
    onCommentCountChange?.(res.commentCount);
  }

  function handleReply(parentCommentId: string, body: string) {
    return submitComment(body, parentCommentId);
  }

  const loading = threads === null && isLoading;

  const activeMember =
    authorContext?.kind === "member" || authorContext?.kind === "visitor"
      ? authorContext.member
      : null;

  const canComment =
    authorContext?.kind === "owner" ||
    (activeMember !== null && activeMember.status === "active");

  const isBlocked = activeMember?.status === "blocked";

  const prompt =
    commentPlaceholder?.trim() ||
    (isPrayer ? preset.comments.placeholder : undefined);

  return (
    <div className={cn("pt-4 space-y-4", isPrayer && "pt-5")}>
      {isPrayer ? (
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-brand-primary/70">
          {preset.comments.sectionLabel}
        </p>
      ) : null}

      {authorContext === null ? (
        <div className="flex items-center gap-2 py-2 text-sm text-brand-ink/50">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading…
        </div>
      ) : isBlocked ? (
        <p className="text-sm text-red-600 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3">
          Your Mission Hub account has been blocked from participating here.
        </p>
      ) : authorContext.kind === "guest" ? (
        allowVisitorOnlyComments() ? (
          <CommunityMemberProfileForm
            onCreated={handleVisitorProfileCreated}
            createAction={createVisitorMemberProfileAction}
          />
        ) : (
          <CommunityJoinPrompt returnPath={returnPath} />
        )
      ) : allowComments ? (
        isPrayer ? (
          <CommunityPrayerResponseForm
            postId={postId}
            authorContext={authorContext}
            preset={preset}
            onSubmit={(body) => submitComment(body)}
            disabled={loading}
            allowVoice={voicePrayerEnabled}
          />
        ) : (
          <CommunityCommentForm
            authorContext={authorContext}
            onSubmit={(body) => submitComment(body)}
            disabled={loading}
            commentPlaceholder={prompt}
          />
        )
      ) : (
        <p className="text-sm text-brand-ink/50 rounded-xl bg-white/70 px-4 py-3 ring-1 ring-black/[0.04]">
          {preset.comments.pausedLabel}
        </p>
      )}
      {actionError ? <p className="text-xs text-red-600">{actionError}</p> : null}

      <div className="relative min-h-[2.5rem]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-brand-ink/50">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {preset.comments.loadingLabel}
          </div>
        ) : loadError ? (
          <p className="text-sm text-red-600 py-2">{loadError}</p>
        ) : (
          <>
            {(isRefreshing || isLoading) && threads !== null ? (
              <div
                className="absolute inset-0 z-10 flex items-start justify-center pt-2 bg-white/70 rounded-xl"
                aria-hidden
              >
                <Loader2 className="h-5 w-5 animate-spin text-brand-primary/50" />
              </div>
            ) : null}
            <CommunityCommentList
              threads={threads ?? []}
              canComment={canComment}
              onReply={
                canComment
                  ? async (parentId, body) => {
                      startRefresh(async () => {
                        await handleReply(parentId, body);
                      });
                    }
                  : undefined
              }
              preset={preset}
            />
          </>
        )}
      </div>
    </div>
  );
}

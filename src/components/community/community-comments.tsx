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
import { MISSION_HUB_REFRESH_EVENT } from "@/lib/community/mission-hub-refresh";
import { useVisualViewportKeyboardInset } from "@/lib/community/use-visual-viewport-keyboard-inset";
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
  autoFocusComposer = false,
  autoFocusKey = 0,
}: {
  postId: string;
  returnPath?: string;
  onCommentCountChange?: (count: number) => void;
  commentPlaceholder?: string | null;
  allowComments?: boolean;
  allowVoiceMessages?: boolean;
  spaceType?: string;
  spaceSlug?: string;
  /** Focus the composer when the comment panel opens. */
  autoFocusComposer?: boolean;
  autoFocusKey?: number;
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
  const [authorResolved, setAuthorResolved] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLoadingComments, startLoadComments] = useTransition();
  const [isRefreshingList, startRefreshList] = useTransition();

  useVisualViewportKeyboardInset(autoFocusComposer);

  const loadComments = useCallback(() => {
    startLoadComments(async () => {
      setLoadError(null);
      const res = await loadPostCommentsAction(postId);
      if (!res.ok) {
        setLoadError(res.error);
        setThreads([]);
        return;
      }
      setThreads(res.threads);
      onCommentCountChange?.(res.commentCount);
    });
  }, [postId, onCommentCountChange]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  useEffect(() => {
    let cancelled = false;
    setAuthorResolved(false);
    void getCommentAuthorContextAction().then((ctx) => {
      if (cancelled) return;
      setAuthorContext(ctx);
      setAuthorResolved(true);
    });
    return () => {
      cancelled = true;
    };
  }, [postId]);

  useEffect(() => {
    function onHubRefresh() {
      startRefreshList(async () => {
        const res = await loadPostCommentsAction(postId);
        if (!res.ok) return;
        setThreads(res.threads);
        onCommentCountChange?.(res.commentCount);
      });
    }
    window.addEventListener(MISSION_HUB_REFRESH_EVENT, onHubRefresh);
    return () => window.removeEventListener(MISSION_HUB_REFRESH_EVENT, onHubRefresh);
  }, [postId, onCommentCountChange]);

  function handleVisitorProfileCreated(member: CommunityMemberProfile) {
    setAuthorContext({ kind: "visitor", member });
    setAuthorResolved(true);
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

  const commentsLoading = threads === null;
  const listRefreshing = isRefreshingList && threads !== null;

  const activeMember =
    authorContext?.kind === "member" || authorContext?.kind === "visitor"
      ? authorContext.member
      : null;

  const canComment =
    authorContext?.kind === "owner" ||
    (activeMember !== null && activeMember.status === "active");

  const canModerate = authorContext?.kind === "owner";
  const isBlocked = activeMember?.status === "blocked";
  const authorLoading = !authorResolved;

  const prompt =
    commentPlaceholder?.trim() ||
    (isPrayer ? preset.comments.placeholder : undefined);

  function renderComposer() {
    if (!allowComments) {
      return (
        <p className="text-sm text-brand-ink/50 rounded-xl bg-white/70 px-4 py-3 ring-1 ring-black/[0.04]">
          {preset.comments.pausedLabel}
        </p>
      );
    }

    if (!authorResolved) {
      return (
        <CommunityCommentForm
          authorContext={null}
          authorLoading
          onSubmit={(body) => submitComment(body)}
          autoFocus={autoFocusComposer}
          autoFocusKey={autoFocusKey}
          commentPlaceholder={prompt}
        />
      );
    }

    if (isBlocked) {
      return (
        <p className="text-sm text-red-600 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3">
          Your Mission Hub account has been blocked from participating here.
        </p>
      );
    }

    if (authorContext?.kind === "guest") {
      return allowVisitorOnlyComments() ? (
        <CommunityMemberProfileForm
          onCreated={handleVisitorProfileCreated}
          createAction={createVisitorMemberProfileAction}
        />
      ) : (
        <CommunityJoinPrompt returnPath={returnPath} />
      );
    }

    if (isPrayer) {
      return (
        <CommunityPrayerResponseForm
          postId={postId}
          authorContext={authorContext!}
          preset={preset}
          onSubmit={(body) => submitComment(body)}
          allowVoice={voicePrayerEnabled}
          autoFocus={autoFocusComposer}
        />
      );
    }

    return (
      <CommunityCommentForm
        authorContext={authorContext}
        onSubmit={(body) => submitComment(body)}
        autoFocus={autoFocusComposer}
        autoFocusKey={autoFocusKey}
        commentPlaceholder={prompt}
      />
    );
  }

  return (
    <div className={cn("pt-4 flex flex-col gap-3", isPrayer && "pt-5")}>
      {isPrayer ? (
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-brand-primary/70">
          {preset.comments.sectionLabel}
        </p>
      ) : null}

      <div className="relative min-h-[2rem] order-1">
        {commentsLoading ? (
          <div
            className="flex items-center gap-2 py-3 text-sm text-brand-ink/50"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-primary/60" aria-hidden />
            <span>{preset.comments.loadingLabel}</span>
          </div>
        ) : loadError ? (
          <p className="text-sm text-red-600 py-2">{loadError}</p>
        ) : (
          <div className="relative">
            {listRefreshing ? (
              <div
                className="absolute right-0 top-0 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 text-[10px] text-brand-ink/50 shadow-sm ring-1 ring-black/[0.04]"
                aria-hidden
              >
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating…
              </div>
            ) : null}
            <CommunityCommentList
              threads={threads ?? []}
              canComment={canComment}
              onReply={
                canComment
                  ? async (parentId, body) => {
                      startRefreshList(async () => {
                        await handleReply(parentId, body);
                      });
                    }
                  : undefined
              }
              preset={preset}
              canModerate={canModerate}
              onModerated={(result) => {
                startRefreshList(() => {
                  setThreads(result.threads);
                  onCommentCountChange?.(result.commentCount);
                });
              }}
            />
          </div>
        )}
      </div>

      <div
        id={`mh-composer-${postId}`}
        className={cn(
          "order-2 z-20 -mx-3.5 px-3.5 sm:-mx-4 sm:px-4",
          "sticky bottom-[calc(env(safe-area-inset-bottom,0px)+var(--mh-keyboard-inset,0px))]",
          "pt-2 pb-1 bg-gradient-to-t from-brand-surface via-brand-surface/98 to-brand-surface/0",
        )}
      >
        {renderComposer()}
        {actionError ? <p className="mt-2 text-xs text-red-600">{actionError}</p> : null}
      </div>
    </div>
  );
}

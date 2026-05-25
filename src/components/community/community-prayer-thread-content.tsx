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
import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";
import { getSpaceInteractionPreset } from "@/lib/community/space-interaction";
import type { CommunityPostCommentThread } from "@/lib/community/types";
import { CommunityCommentList } from "./community-comment-list";
import { CommunityJoinPrompt } from "./community-join-prompt";
import { CommunityMemberProfileForm } from "./community-member-profile-form";
import { Button } from "@/components/ui/button";
import { MISSION_HUB_REFRESH_EVENT } from "@/lib/community/mission-hub-refresh";
import { cn } from "@/lib/utils";

export function CommunityPrayerThreadContent({
  postId,
  returnPath,
  onCommentCountChange,
  onRequestSharePrayer,
  allowComments = true,
  spaceType,
  spaceSlug,
  refreshKey = 0,
}: {
  postId: string;
  returnPath?: string;
  onCommentCountChange?: (count: number) => void;
  onRequestSharePrayer?: () => void;
  allowComments?: boolean;
  spaceType?: string;
  spaceSlug?: string;
  /** Bump to reload thread after new prayer */
  refreshKey?: number;
}) {
  const preset = getSpaceInteractionPreset(spaceType, spaceSlug);
  const [threads, setThreads] = useState<CommunityPostCommentThread[] | null>(null);
  const [authorContext, setAuthorContext] = useState<CommentAuthorContext | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, startLoad] = useTransition();

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
      onCommentCountChange?.(res.commentCount);
    });
  }, [postId, onCommentCountChange]);

  useEffect(() => {
    loadComments();
    void getCommentAuthorContextAction().then(setAuthorContext);
  }, [loadComments, refreshKey]);

  useEffect(() => {
    function onHubRefresh() {
      loadComments();
    }
    window.addEventListener(MISSION_HUB_REFRESH_EVENT, onHubRefresh);
    return () => window.removeEventListener(MISSION_HUB_REFRESH_EVENT, onHubRefresh);
  }, [loadComments]);

  function handleVisitorProfileCreated(member: CommunityMemberProfile) {
    setAuthorContext({ kind: "visitor", member });
  }

  const loading = threads === null && isLoading;
  const activeMember =
    authorContext?.kind === "member" || authorContext?.kind === "visitor"
      ? authorContext.member
      : null;
  const isBlocked = activeMember?.status === "blocked";
  const canModerate = authorContext?.kind === "owner";

  function applyModerationResult(result: {
    threads: CommunityPostCommentThread[];
    commentCount: number;
  }) {
    setThreads(result.threads);
    onCommentCountChange?.(result.commentCount);
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-brand-ink/50">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {preset.comments.loadingLabel}
        </div>
      ) : loadError ? (
        <p className="text-sm text-red-600 py-4">{loadError}</p>
      ) : (
        <CommunityCommentList
          threads={threads ?? []}
          canComment={false}
          preset={preset}
          prayerThreadLayout
          canModerate={canModerate}
          onModerated={applyModerationResult}
        />
      )}

      {!loading && (threads?.length ?? 0) === 0 && allowComments && onRequestSharePrayer ? (
        <div className="pt-2 pb-1">
          <Button
            type="button"
            onClick={onRequestSharePrayer}
            className="w-full rounded-full min-h-[2.875rem] bg-brand-primary hover:bg-brand-primary/92 text-sm font-semibold"
          >
            <span aria-hidden className="mr-1.5">
              🙏
            </span>
            {preset.comments.emptyCta}
          </Button>
        </div>
      ) : null}

      {authorContext === null ? null : isBlocked ? (
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
          <CommunityJoinPrompt returnPath={returnPath ?? "/community"} />
        )
      ) : !allowComments ? (
        <p className="text-sm text-brand-ink/50 rounded-xl bg-brand-surface/40 px-4 py-3">
          {preset.comments.pausedLabel}
        </p>
      ) : null}
    </div>
  );
}

/** Submit prayer from composer sheet */
export async function submitPrayerComment(
  postId: string,
  body: string,
): Promise<{ commentCount: number }> {
  const res = await createPostCommentAction({
    postId,
    body,
    parentCommentId: null,
  });
  if (!res.ok) throw new Error(res.error);
  return { commentCount: res.commentCount };
}

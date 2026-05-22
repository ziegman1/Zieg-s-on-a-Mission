"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CommunityPostCoverImage } from "./community-post-cover-image";
import type { CommunityPostFeedItem } from "@/lib/community/types";
import { formatCommunityPostDate } from "@/lib/community/format-post-date";
import { getCommunityPostBodyPreview } from "@/lib/community/post-preview";
import { MH } from "@/lib/community/hub-design";
import { CommunityAvatar } from "./community-avatar";
import { CommunityComments } from "./community-comments";
import { CommunityEngagementBar } from "./community-engagement-bar";
import { CommunityPrayerEngagement } from "./community-prayer-engagement";
import { getSpaceInteractionPreset } from "@/lib/community/space-interaction";
import { canUseVoicePrayer } from "@/lib/community/voice-prayer";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import { CommunityPostOwnerMenu } from "./community-post-owner-menu";
import { CommunityPostTypeBadge } from "./community-post-type-badge";
import { cn } from "@/lib/utils";

export function CommunityPostCard({
  post: postProp,
  showSpaceLabel = true,
  variant = "default",
  owner = null,
  composerSpaces = [],
}: {
  post: CommunityPostFeedItem;
  showSpaceLabel?: boolean;
  variant?: "default" | "spiritual";
  owner?: CommunityOwner | null;
  composerSpaces?: CommunityComposerSpace[];
}) {
  const [post, setPost] = useState(postProp);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    setPost(postProp);
    setRemoved(false);
  }, [postProp]);

  if (removed) return null;
  const spiritual = variant === "spiritual";
  const preset = getSpaceInteractionPreset(post.spaceType, post.spaceSlug);
  const prayerSpace = preset.mode === "prayer";
  const voicePrayerEnabled = canUseVoicePrayer({
    spaceType: post.spaceType,
    slug: post.spaceSlug,
    allowVoiceMessages: post.spaceAllowVoiceMessages,
  });
  const displayTitle = post.title?.trim() || null;
  const { fullBody, collapsedPreview, canExpand } = getCommunityPostBodyPreview(
    post.body,
    post.excerpt,
  );

  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const returnPath = showSpaceLabel ? "/community" : `/community/${post.spaceSlug}`;

  const displayText = expanded ? fullBody : collapsedPreview;
  const showReadMoreControl = canExpand;

  return (
    <article
      id={`post-${post.id}`}
      className={cn(
        "scroll-mt-[5.5rem] overflow-hidden",
        spiritual
          ? "rounded-2xl bg-white/62 shadow-[0_2px_24px_rgba(30,54,68,0.045)] ring-1 ring-black/[0.03]"
          : MH.cardFlat,
      )}
    >
      <header
        className={cn(
          "flex items-start gap-2.5",
          spiritual ? "px-4 pt-4 sm:px-5 sm:pt-5" : "px-3.5 pt-3.5 sm:px-4 sm:pt-4",
        )}
      >
        <CommunityAvatar
          name={post.authorAvatarName}
          imageUrl={post.authorImageUrl}
          size="md"
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span
              className={cn(
                "leading-tight text-brand-ink",
                spiritual ? "text-[15px] font-medium" : "text-[15px] font-semibold",
              )}
            >
              {post.authorName}
            </span>
            <CommunityPostTypeBadge type={post.postType} />
          </div>
          <div
            className={cn(
              "mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs",
              spiritual ? "text-brand-ink/40" : "text-brand-ink/45",
            )}
          >
            {showSpaceLabel ? (
              <Link
                href={`/community/${post.spaceSlug}`}
                className="font-medium text-brand-primary/90 hover:underline"
              >
                {post.spaceTitle}
              </Link>
            ) : null}
            {showSpaceLabel ? <span aria-hidden>·</span> : null}
            <time dateTime={post.publishedAt}>{formatCommunityPostDate(post.publishedAt)}</time>
          </div>
        </div>
        {owner && composerSpaces.length > 0 ? (
          <CommunityPostOwnerMenu
            post={post}
            owner={owner}
            composerSpaces={composerSpaces}
            onPostUpdated={setPost}
            onPostRemoved={() => setRemoved(true)}
          />
        ) : null}
      </header>

      {(displayTitle || displayText) && (
        <div
          className={cn(
            "pt-2 space-y-1.5",
            spiritual ? "px-4 sm:px-5" : "px-3.5 sm:px-4",
          )}
        >
          {displayTitle ? (
            <h3
              className={cn(
                "leading-snug text-brand-ink",
                spiritual
                  ? "font-serif text-[17px] font-medium tracking-wide"
                  : "text-[17px] font-semibold",
              )}
            >
              {displayTitle}
            </h3>
          ) : null}
          {displayText ? (
            <div className="space-y-1 min-w-0">
              <p
                className={cn(
                  "whitespace-pre-wrap break-words text-brand-ink/88",
                  spiritual ? "text-[15px] leading-[1.68]" : "text-[15px] leading-[1.55] text-brand-ink/90",
                )}
              >
                {displayText}
              </p>
              {showReadMoreControl ? (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="text-sm font-medium text-brand-primary hover:underline"
                  aria-expanded={expanded}
                >
                  {expanded ? "Show less" : "Read more"}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {post.coverImageUrl ? (
        <div className={spiritual ? "px-4 sm:px-5 pt-3" : "px-3.5 sm:px-4 pt-2.5"}>
          <CommunityPostCoverImage src={post.coverImageUrl} variant="feed" />
        </div>
      ) : null}

      <div className={spiritual ? "px-4 sm:px-5 py-3" : "px-3.5 sm:px-4 py-2.5"}>
        {prayerSpace ? (
          <CommunityPrayerEngagement
            postId={post.id}
            initialCounts={post.reactionCounts}
            initialMyReactions={post.myReactions}
            initialCommentCount={commentCount}
            allowReactions={post.spaceAllowReactions}
            allowComments={post.spaceAllowComments}
            preset={preset}
            returnPath={returnPath}
            allowVoicePrayer={voicePrayerEnabled}
            spaceType={post.spaceType}
            spaceSlug={post.spaceSlug}
          />
        ) : (
          <CommunityEngagementBar
            postId={post.id}
            initialCounts={post.reactionCounts}
            initialMyReactions={post.myReactions}
            commentCount={commentCount}
            commentsOpen={commentsOpen}
            onCommentsToggle={() => setCommentsOpen((v) => !v)}
            allowReactions={post.spaceAllowReactions}
            allowComments={post.spaceAllowComments}
            interactionPreset={preset}
            spaceType={post.spaceType}
            spaceSlug={post.spaceSlug}
          />
        )}
      </div>

      {!prayerSpace && commentsOpen && post.spaceAllowComments ? (
        <div
          className={cn(
            "pt-0 border-t",
            spiritual
              ? "px-4 sm:px-5 pb-4 sm:pb-5 border-black/[0.03]"
              : "px-3.5 sm:px-4 pb-3.5 sm:pb-4 border-black/[0.04]",
          )}
        >
          <CommunityComments
            postId={post.id}
            returnPath={returnPath}
            onCommentCountChange={setCommentCount}
            commentPlaceholder={post.spaceEngagementPrompt}
            allowComments={post.spaceAllowComments}
            allowVoiceMessages={voicePrayerEnabled}
            spaceType={post.spaceType}
            spaceSlug={post.spaceSlug}
          />
        </div>
      ) : null}
    </article>
  );
}

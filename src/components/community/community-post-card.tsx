"use client";

import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { focusMissionHubCommentInput } from "@/lib/community/use-mobile-composer-focus";
import {
  scrollMissionHubPostIntoView,
  shouldAutoScrollToFeed,
} from "@/lib/community/mission-hub-scroll";
import Link from "next/link";
import { CommunityPostCoverImage } from "./community-post-cover-image";
import type { CommunityPostFeedItem } from "@/lib/community/types";
import { formatCommunityPostDate } from "@/lib/community/format-post-date";
import { getCommunityPostBodyPreview } from "@/lib/community/post-preview";
import { parsePrayerResponseBody } from "@/lib/community/prayer-response-body";
import { CommunityPostBodyClamp } from "./community-post-body-clamp";
import { CommunityVoicePrayerPlayer } from "./community-voice-prayer-player";
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
import { CommunityBlogAnnouncementLink } from "./community-blog-announcement-link";
import { CommunityNewsletterAnnouncementLink } from "./community-newsletter-announcement-link";
import { cn } from "@/lib/utils";

export function CommunityPostCard({
  post: postProp,
  showSpaceLabel = true,
  variant = "default",
  owner = null,
  composerSpaces = [],
  isLatestInFeed = false,
}: {
  post: CommunityPostFeedItem;
  showSpaceLabel?: boolean;
  variant?: "default" | "spiritual";
  owner?: CommunityOwner | null;
  composerSpaces?: CommunityComposerSpace[];
  isLatestInFeed?: boolean;
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
  const { fullBody } = getCommunityPostBodyPreview(post.body, post.excerpt);

  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [composerFocusKey, setComposerFocusKey] = useState(0);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);

  const openCommentsWithKeyboard = useCallback(() => {
    if (commentsOpen) return;
    flushSync(() => {
      setCommentsOpen(true);
      setComposerFocusKey((k) => k + 1);
    });
    focusMissionHubCommentInput(post.id);
  }, [commentsOpen, post.id]);

  const closeComments = useCallback(() => {
    setCommentsOpen(false);
  }, []);

  useEffect(() => {
    if (!commentsOpen) return;
    if (
      !shouldAutoScrollToFeed({
        userInitiated: true,
      })
    ) {
      return;
    }
    scrollMissionHubPostIntoView(post.id, { userInitiated: true });
  }, [commentsOpen, post.id]);
  const returnPath = showSpaceLabel ? "/community" : `/community/${post.spaceSlug}`;

  const parsedBody = parsePrayerResponseBody(post.body);
  const isVoicePost = parsedBody.kind === "voice";

  return (
    <article
      id={`post-${post.id}`}
      data-mission-hub-latest-post={isLatestInFeed ? "true" : undefined}
      className={cn(
        "scroll-mt-[5.5rem] overflow-hidden",
        spiritual
          ? "rounded-2xl bg-white/62 shadow-[0_2px_20px_rgba(30,54,68,0.04)] ring-1 ring-black/[0.03] [--mh-scroll-fade-from:rgba(255,255,255,0.92)]"
          : MH.cardFlat,
      )}
    >
      <header
        className={cn(
          "flex items-start gap-2.5",
          spiritual ? "px-3.5 pt-3.5 sm:px-4 sm:pt-4" : "px-3.5 pt-3.5 sm:px-4 sm:pt-4",
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

      {(displayTitle || fullBody || isVoicePost) && (
        <div
          className={cn(
            "pt-1.5 space-y-1",
            spiritual ? "px-3.5 sm:px-4" : "px-3.5 sm:px-4",
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
          {isVoicePost ? (
            <div className="mt-2">
              <CommunityVoicePrayerPlayer
                audioUrl={parsedBody.audioUrl}
                durationSeconds={parsedBody.durationSeconds}
                mimeType={parsedBody.mimeType}
                hasVideo={parsedBody.hasVideo}
                showPlayLabel
              />
            </div>
          ) : fullBody ? (
            <CommunityPostBodyClamp
              fullBody={fullBody}
              expanded={expanded}
              onToggleExpand={() => setExpanded((v) => !v)}
            />
          ) : null}
        </div>
      )}

      {post.coverImageUrl ? (
        <div className={spiritual ? "px-3.5 sm:px-4 pt-2" : "px-3.5 sm:px-4 pt-2"}>
          <CommunityPostCoverImage src={post.coverImageUrl} variant="feed" />
        </div>
      ) : null}

      {post.blogAnnouncement ? (
        <div className={spiritual ? "px-3.5 sm:px-4 pt-2" : "px-3.5 sm:px-4 pt-2"}>
          <CommunityBlogAnnouncementLink announcement={post.blogAnnouncement} />
        </div>
      ) : null}

      {post.newsletterAnnouncement ? (
        <div className={spiritual ? "px-3.5 sm:px-4 pt-2" : "px-3.5 sm:px-4 pt-2"}>
          <CommunityNewsletterAnnouncementLink announcement={post.newsletterAnnouncement} />
        </div>
      ) : null}

      <div className={spiritual ? "px-3.5 sm:px-4 py-2 pb-2.5" : "px-3.5 sm:px-4 py-2"}>
        {prayerSpace ? (
          <CommunityPrayerEngagement
            postId={post.id}
            initialCounts={post.reactionCounts}
            initialMyReactions={post.myReactions}
            initialCommentCount={commentCount}
            initialVoiceResponseCount={post.voiceResponseCount ?? 0}
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
            onCommentsActivate={openCommentsWithKeyboard}
            onCommentsToggle={closeComments}
            allowReactions={post.spaceAllowReactions}
            allowComments={post.spaceAllowComments}
            interactionPreset={preset}
            spaceType={post.spaceType}
            spaceSlug={post.spaceSlug}
          />
        )}
      </div>

      {!prayerSpace && post.spaceAllowComments && commentsOpen ? (
        <div
          className={cn(
            "pt-0 border-t transition-[opacity,padding] duration-150",
            spiritual
              ? "px-3.5 sm:px-4 border-black/[0.03]"
              : "px-3.5 sm:px-4 border-black/[0.04]",
            "pb-3.5 opacity-100",
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
            autoFocusComposer
            autoFocusKey={composerFocusKey}
          />
        </div>
      ) : null}
    </article>
  );
}

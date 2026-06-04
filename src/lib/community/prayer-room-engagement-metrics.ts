import type { CommunityPostFeedItem, ReactionCounts } from "@/lib/community/types";
import type { CommunityPostCommentThread } from "@/lib/community/types";
import { isVoicePrayerBody } from "@/lib/community/prayer-response-body";
import type { PrayerRoomActivitySummary } from "@/lib/community/prayer-room-composer";

/** Room-level engagement signals (welcome area and future summaries). */
export type PrayerRoomWelcomeMetrics = {
  /** Published feed posts — prayer requests, praise reports, encouragement, etc. */
  requestPostCount: number;
  /** Current `prayed` reaction rows summed across visible feed posts. */
  peoplePrayingCount: number;
  /** Published comment/prayer response rows summed across feed posts. */
  responseCount: number;
  /** Voice prayer comment rows summed across feed posts. */
  voiceResponseCount: number;
  /** Breakdown by post type (prayer / praise / encouragement / other). */
  postTypeSummary: PrayerRoomActivitySummary;
};

/** Per-post engagement signals for the prayer room feed toolbar. */
export type PostPrayerEngagementMetrics = {
  /** Current `prayed` reaction rows on this post. */
  peoplePrayingCount: number;
  /** Published comment/prayer response rows (written + voice). */
  responseCount: number;
  /** Published voice prayer comment rows on this post. */
  voiceResponseCount: number;
};

export function prayedReactionCount(counts: ReactionCounts | undefined): number {
  return counts?.prayed ?? 0;
}

export function derivePrayerRoomWelcomeMetrics(
  posts: Pick<CommunityPostFeedItem, "postType" | "reactionCounts" | "commentCount" | "voiceResponseCount">[],
): PrayerRoomWelcomeMetrics {
  let peoplePrayingCount = 0;
  let responseCount = 0;
  let voiceResponseCount = 0;

  for (const post of posts) {
    peoplePrayingCount += prayedReactionCount(post.reactionCounts);
    responseCount += post.commentCount ?? 0;
    voiceResponseCount += post.voiceResponseCount ?? 0;
  }

  const postTypeSummary = summarizePostTypes(posts);

  return {
    requestPostCount: posts.length,
    peoplePrayingCount,
    responseCount,
    voiceResponseCount,
    postTypeSummary,
  };
}

function summarizePostTypes(
  posts: { postType: string }[],
): PrayerRoomActivitySummary {
  let prayerCount = 0;
  let praiseCount = 0;
  let encouragementCount = 0;
  let otherCount = 0;

  for (const post of posts) {
    if (post.postType === "prayer") prayerCount += 1;
    else if (post.postType === "praise") praiseCount += 1;
    else if (post.postType === "encouragement") encouragementCount += 1;
    else otherCount += 1;
  }

  return {
    prayerCount,
    praiseCount,
    encouragementCount,
    otherCount,
    total: posts.length,
  };
}

export function derivePostPrayerEngagementMetrics(input: {
  reactionCounts: ReactionCounts;
  commentCount: number;
  voiceResponseCount?: number;
}): PostPrayerEngagementMetrics {
  return {
    peoplePrayingCount: prayedReactionCount(input.reactionCounts),
    responseCount: input.commentCount,
    voiceResponseCount: input.voiceResponseCount ?? 0,
  };
}

/** Welcome badge — scrolls to feed of shared requests/posts. */
export function formatViewRequestsLabel(requestPostCount: number): string {
  if (requestPostCount <= 0) return "View Requests";
  return `View Requests (${requestPostCount})`;
}

export function viewRequestsAriaLabel(requestPostCount: number): string {
  if (requestPostCount <= 0) {
    return "View prayer requests — none shared yet";
  }
  return `View ${requestPostCount} shared prayer ${requestPostCount === 1 ? "request" : "requests"}`;
}

export function formatPeoplePrayingLabel(count: number): string {
  if (count <= 0) return "Praying";
  return count === 1 ? "People praying · 1" : `People praying · ${count}`;
}

export function formatResponsesLabel(count: number): string {
  if (count <= 0) return "Responses";
  return count === 1 ? "Responses (1)" : `Responses (${count})`;
}

export function formatVoicePrayersLabel(count: number): string | null {
  if (count <= 0) return null;
  return count === 1 ? "Voice prayers (1)" : `Voice prayers (${count})`;
}

export function responsesThreadAriaLabel(responseCount: number): string {
  if (responseCount <= 0) {
    return "View responses — none shared yet";
  }
  return `View ${responseCount} ${responseCount === 1 ? "response" : "responses"}`;
}

export function countVoiceResponsesInThreads(
  threads: CommunityPostCommentThread[],
): number {
  let count = 0;
  for (const thread of threads) {
    if (isVoicePrayerBody(thread.comment.body)) count += 1;
    for (const reply of thread.replies) {
      if (isVoicePrayerBody(reply.body)) count += 1;
    }
  }
  return count;
}

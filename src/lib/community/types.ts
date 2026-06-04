/**
 * Community / Mission Hub types — aligned with a future Supabase schema.
 * Tables (planned): community_spaces, community_posts, community_comments, community_reactions
 */

export const COMMUNITY_REACTION_TYPES = [
  "like",
  "love",
  "prayed",
  "celebrating",
  "encouraged",
] as const;

export type CommunityReactionType = (typeof COMMUNITY_REACTION_TYPES)[number];

/** DB-backed statuses on `community_spaces` */
export type CommunitySpaceDbStatus = "draft" | "published" | "archived";

/** UI-only status for planned placeholder cards (not stored in DB yet) */
export type CommunitySpacePlaceholderStatus = "coming_soon";

export type CommunitySpaceStatus = CommunitySpaceDbStatus | CommunitySpacePlaceholderStatus;

export type CommunitySpaceIcon =
  | "prayer"
  | "praise"
  | "updates"
  | "behind_scenes"
  | "newsletter"
  | "blog"
  | "resources"
  | "events";

/** Future `community_spaces` row shape */
export type CommunitySpace = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: CommunitySpaceIcon;
  status: CommunitySpaceStatus;
  /** Placeholder until posts are wired */
  postCount: number;
  sortOrder?: number;
};

export type CommunityPostDbStatus = "draft" | "published" | "archived";

export type CommunityPostType =
  | "prayer"
  | "praise"
  | "encouragement"
  | "update"
  | "newsletter"
  | "blog"
  | "behind_the_scenes"
  | "resource"
  | "event";

/** Per-type counts for a single post */
export type ReactionCounts = Record<CommunityReactionType, number>;

/** Storefront feed item before reaction counts are loaded */
export type CommunityPostFeedItemBase = {
  id: string;
  spaceId: string;
  spaceTitle: string;
  spaceSlug: string;
  title: string | null;
  body: string;
  excerpt: string | null;
  postType: CommunityPostType;
  coverImageUrl: string | null;
  publishedAt: string;
  authorName: string;
  authorImageUrl: string | null;
  /** Initials fallback when authorImageUrl is missing */
  authorAvatarName: string;
  spaceAllowComments: boolean;
  spaceAllowReactions: boolean;
  spaceAllowVoiceMessages: boolean;
  spaceEngagementPrompt: string | null;
  /** `community_spaces.space_type` — drives interaction presets */
  spaceType: string;
  /** Present when post is a Newsletter Builder announcement (links to /newsletters/[slug]) */
  newsletterAnnouncement?: NewsletterAnnouncementFeedLink | null;
};

/** Parsed from `community_posts.metadata` for newsletter publish announcements */
export type NewsletterAnnouncementFeedLink = {
  newsletterPath: string;
  newsletterSlug: string;
  issueDate: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
};

export type CommunityCommentStatus = "published" | "hidden" | "archived";

/** `community_post_comments` row (storefront) */
export type CommunityPostComment = {
  id: string;
  postId: string;
  parentCommentId: string | null;
  visitorKey: string;
  displayName: string;
  profileImageUrl: string | null;
  body: string;
  status: CommunityCommentStatus;
  createdAt: string;
};

export type CommunityPostCommentThread = {
  comment: CommunityPostComment;
  replies: CommunityPostComment[];
};

/** Storefront feed item (published posts in published spaces) */
export type CommunityPostFeedItem = CommunityPostFeedItemBase & {
  reactionCounts: ReactionCounts;
  myReactions: CommunityReactionType[];
  commentCount: number;
  /** Published voice prayer comments on this post (subset of commentCount). */
  voiceResponseCount: number;
};

/** Future `community_posts` row shape (full DB) */
export type CommunityPost = {
  id: string;
  spaceId: string;
  title: string | null;
  body: string;
  excerpt: string | null;
  postType: CommunityPostType;
  status: CommunityPostDbStatus;
  coverImageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/** `community_post_reactions` row shape */
export type CommunityPostReaction = {
  id: string;
  postId: string;
  reactionType: CommunityReactionType;
  visitorKey: string;
  createdAt: string;
};

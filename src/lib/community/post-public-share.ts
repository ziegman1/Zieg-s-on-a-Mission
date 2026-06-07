import { isAdminRole } from "@/lib/admin-users";
import { parseBlogAnnouncementMetadata } from "@/lib/blog/mission-hub-announcement";
import { getCommunityPostBodyPreview } from "@/lib/community/post-preview";
import { isVoicePrayerBody } from "@/lib/community/prayer-response-body";
import { communityPostAnchorPath } from "@/lib/community/post-url";
import { parseNewsletterAnnouncementMetadata } from "@/lib/newsletter/mission-hub-announcement";

export const PUBLIC_SHARE_EXCERPT_MAX = 280;
export const MISSION_HUB_JOIN_PATH = "/community/join";
export const MISSION_HUB_LOGIN_PATH = "/community/login";
export const FACEBOOK_SHARER_BASE = "https://www.facebook.com/sharer/sharer.php";

export type CommunityPostPublicShareMetadata = {
  enabled: boolean;
  enabledAt: string;
  enabledByUserId: string;
  shareTitle?: string;
  shareExcerpt?: string;
};

export type PostShareEligibilityInput = {
  status: string;
  body: string;
  postType: string;
  sourceKind: string | null;
  metadata: unknown;
  authorRole: string | null;
  spaceStatus: string;
  spaceSlug: string;
};

export type PublicSharePreview = {
  postId: string;
  title: string;
  excerpt: string;
  spaceTitle: string;
  spaceSlug: string;
  publishedAt: string;
  coverImageUrl: string | null;
  hubPostPath: string;
  sharePagePath: string;
  preferredSharePath: string;
  usesHubSharePage: boolean;
};

export function communitySharePagePath(postId: string): string {
  return `/community/share/${postId.trim()}`;
}

export function parsePublicShareMetadata(
  metadata: unknown,
): CommunityPostPublicShareMetadata | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const raw = (metadata as Record<string, unknown>).publicShare;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const share = raw as Record<string, unknown>;
  if (share.enabled !== true) return null;
  if (typeof share.enabledAt !== "string" || !share.enabledAt.trim()) return null;
  if (typeof share.enabledByUserId !== "string" || !share.enabledByUserId.trim()) return null;
  return {
    enabled: true,
    enabledAt: share.enabledAt,
    enabledByUserId: share.enabledByUserId,
    shareTitle:
      typeof share.shareTitle === "string" && share.shareTitle.trim()
        ? share.shareTitle.trim()
        : undefined,
    shareExcerpt:
      typeof share.shareExcerpt === "string" && share.shareExcerpt.trim()
        ? share.shareExcerpt.trim()
        : undefined,
  };
}

export function mergePublicShareMetadata(
  metadata: unknown,
  patch: CommunityPostPublicShareMetadata,
): Record<string, unknown> {
  const base =
    metadata && typeof metadata === "object" && !Array.isArray(metadata)
      ? { ...(metadata as Record<string, unknown>) }
      : {};
  return { ...base, publicShare: patch };
}

export function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateShareExcerpt(text: string, max = PUBLIC_SHARE_EXCERPT_MAX): string {
  const cleaned = stripHtml(text);
  if (cleaned.length <= max) return cleaned;
  const slice = cleaned.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut =
    lastSpace > Math.floor(max * 0.55) ? slice.slice(0, lastSpace) : slice.trimEnd();
  return `${cut.trim()}…`;
}

export function isValidShareImageUrl(url: string | null | undefined): url is string {
  if (!url?.trim()) return false;
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function evaluatePostShareEligibility(
  input: PostShareEligibilityInput,
): { eligible: true } | { eligible: false; reason: string } {
  if (input.status === "draft") {
    return { eligible: false, reason: "Draft posts cannot be shared. Publish the post first." };
  }
  if (input.status === "archived") {
    return { eligible: false, reason: "Archived posts cannot be shared on Facebook." };
  }
  if (input.status !== "published") {
    return { eligible: false, reason: "Only published posts can be shared on Facebook." };
  }
  if (input.spaceStatus !== "published") {
    return {
      eligible: false,
      reason: "This post's space is not published. Publish the space before sharing.",
    };
  }
  if (isVoicePrayerBody(input.body)) {
    return {
      eligible: false,
      reason: "Voice or audio prayer posts cannot be shared on Facebook.",
    };
  }
  if (input.authorRole && !isAdminRole(input.authorRole)) {
    return {
      eligible: false,
      reason:
        "Member-authored posts cannot be shared on Facebook. Only ministry-published updates are eligible.",
    };
  }
  return { eligible: true };
}

export function resolvePreferredSharePath(input: {
  postId: string;
  sourceKind: string | null;
  metadata: unknown;
  postType: string;
}): { path: string; usesHubSharePage: boolean } {
  const blog = parseBlogAnnouncementMetadata(
    input.metadata,
    input.sourceKind,
    input.postType,
  );
  if (blog?.blogPath) {
    return { path: blog.blogPath, usesHubSharePage: false };
  }

  const newsletter = parseNewsletterAnnouncementMetadata(input.metadata, input.sourceKind);
  if (newsletter?.newsletterPath) {
    return { path: newsletter.newsletterPath, usesHubSharePage: false };
  }

  return { path: communitySharePagePath(input.postId), usesHubSharePage: true };
}

export function buildSafeShareExcerpt(input: {
  body: string;
  excerpt: string | null;
  shareExcerpt?: string | null;
  title?: string | null;
}): string {
  const override = input.shareExcerpt?.trim();
  if (override) return truncateShareExcerpt(override);

  const stored = input.excerpt?.trim();
  if (stored) return truncateShareExcerpt(stored);

  const { collapsedPreview } = getCommunityPostBodyPreview(input.body, null);
  if (collapsedPreview.trim()) return truncateShareExcerpt(collapsedPreview);

  const title = input.title?.trim();
  if (title) return title;

  return "A new ministry update is available in Mission Hub.";
}

export function buildSharePreview(input: {
  postId: string;
  title: string | null;
  body: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  spaceTitle: string;
  spaceSlug: string;
  sourceKind: string | null;
  metadata: unknown;
  postType: string;
  shareTitle?: string | null;
  shareExcerpt?: string | null;
}): PublicSharePreview {
  const publishedAt = (input.publishedAt ?? input.createdAt).toISOString();
  const title =
    input.shareTitle?.trim() ||
    input.title?.trim() ||
    `Update from ${input.spaceTitle}`;

  const excerpt = buildSafeShareExcerpt({
    body: input.body,
    excerpt: input.excerpt,
    shareExcerpt: input.shareExcerpt,
    title: input.title,
  });

  const { path: preferredSharePath, usesHubSharePage } = resolvePreferredSharePath({
    postId: input.postId,
    sourceKind: input.sourceKind,
    metadata: input.metadata,
    postType: input.postType,
  });

  return {
    postId: input.postId,
    title,
    excerpt,
    spaceTitle: input.spaceTitle,
    spaceSlug: input.spaceSlug,
    publishedAt,
    coverImageUrl: isValidShareImageUrl(input.coverImageUrl) ? input.coverImageUrl.trim() : null,
    hubPostPath: communityPostAnchorPath(input.spaceSlug, input.postId),
    sharePagePath: communitySharePagePath(input.postId),
    preferredSharePath,
    usesHubSharePage,
  };
}

export function buildFacebookShareCaption(input: {
  shareUrl: string;
  postSummary: string;
  joinUrl: string;
}): string {
  const summary = input.postSummary.trim() || "A new ministry update is available in Mission Hub.";

  return `We recently shared a new update in Mission Hub.

${summary}

Mission Hub is our online gathering place where friends, family, prayer partners, and supporters can stay connected through ministry updates, prayer requests, stories, newsletters, and opportunities to engage in God's mission.

Read the update here:

${input.shareUrl}

Join Mission Hub:

${input.joinUrl}`;
}

export function buildFacebookSharerUrl(shareUrl: string): string {
  return `${FACEBOOK_SHARER_BASE}?u=${encodeURIComponent(shareUrl)}`;
}

/** Mission Hub invitation block copy for public share landing pages. */
export const MISSION_HUB_SHARE_INVITATION = {
  heading: "Stay Connected Through Mission Hub",
  intro:
    "Mission Hub is our online gathering place where friends, family, prayer partners, and supporters can:",
  bullets: [
    "Follow ministry updates",
    "Receive prayer requests and praise reports",
    "Read newsletters and blog articles",
    "Hear stories from the field",
    "Engage with what God is doing through the ministry",
  ],
  closing: "Join us and become part of the journey.",
} as const;

import { isAdminRole } from "@/lib/admin-users";
import { parseBlogAnnouncementMetadata } from "@/lib/blog/mission-hub-announcement";
import { getCommunityPostBodyPreview } from "@/lib/community/post-preview";
import { isVoicePrayerBody } from "@/lib/community/prayer-response-body";
import { communityPostAnchorPath } from "@/lib/community/post-url";
import { parseNewsletterAnnouncementMetadata } from "@/lib/newsletter/mission-hub-announcement";

export const PUBLIC_SHARE_EXCERPT_MIN = 220;
export const PUBLIC_SHARE_EXCERPT_MAX = 350;
export const PUBLIC_SHARE_EXCERPT_TARGET = 350;
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

export type PostShareImageAsset = {
  url: string;
  filename: string;
};

/** Unified payload for Facebook, X, LinkedIn, email, and future social integrations. */
export type PostShareAssets = {
  caption: string;
  shareUrl: string;
  featuredImage: string | null;
  images: PostShareImageAsset[];
};

export type SharePageSocialMetadata = {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
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

export function truncateShareExcerpt(
  text: string,
  max = PUBLIC_SHARE_EXCERPT_MAX,
  min = PUBLIC_SHARE_EXCERPT_MIN,
): string {
  const cleaned = stripHtml(text);
  if (cleaned.length <= max) return cleaned;

  const slice = cleaned.slice(0, max);
  const sentenceEndRegex = /[.!?](?:\s|$)/g;
  let bestSentenceEnd = -1;
  let match: RegExpExecArray | null;
  while ((match = sentenceEndRegex.exec(slice)) !== null) {
    const end = match.index + 1;
    if (end >= min && end <= max) bestSentenceEnd = end;
  }
  if (bestSentenceEnd > 0) {
    return `${slice.slice(0, bestSentenceEnd).trim()}...`;
  }

  const lastSpace = slice.lastIndexOf(" ");
  const cut =
    lastSpace > Math.floor(max * 0.55) ? slice.slice(0, lastSpace) : slice.trimEnd();
  return `${cut.trim()}...`;
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
  excerpt: string;
  shareUrl: string;
}): string {
  const excerpt = input.excerpt.trim() || "A new ministry update is available in Mission Hub.";

  return `New Update in Mission Hub

${excerpt}

Read the full update in Mission Hub:

${input.shareUrl}`;
}

export function buildFacebookSharerUrl(shareUrl: string): string {
  return `${FACEBOOK_SHARER_BASE}?u=${encodeURIComponent(shareUrl)}`;
}

function extensionFromImageUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const ext = pathname.split(".").pop()?.toLowerCase();
    if (ext && /^[a-z0-9]{2,5}$/.test(ext)) return ext;
  } catch {
    /* ignore */
  }
  return "jpg";
}

export function shareImageFilename(postId: string, index: number, url: string): string {
  const ext = extensionFromImageUrl(url);
  const suffix = index === 0 ? "featured" : `gallery-${index}`;
  return `mission-hub-${postId.slice(0, 8)}-${suffix}.${ext}`;
}

/** Cover image plus optional gallery URLs stored on post metadata. */
export function collectShareImageUrls(input: {
  coverImageUrl: string | null | undefined;
  metadata: unknown;
}): string[] {
  const urls: string[] = [];

  const pushUnique = (value: string | null | undefined) => {
    if (!isValidShareImageUrl(value)) return;
    const trimmed = value.trim();
    if (!urls.includes(trimmed)) urls.push(trimmed);
  };

  pushUnique(input.coverImageUrl);

  if (input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)) {
    const meta = input.metadata as Record<string, unknown>;
    const gallery = meta.galleryImages ?? meta.shareGalleryImages ?? meta.images;
    if (Array.isArray(gallery)) {
      for (const item of gallery) {
        if (typeof item === "string") pushUnique(item);
      }
    }
  }

  return urls;
}

export function buildPostShareAssets(input: {
  preview: PublicSharePreview;
  shareUrl: string;
  metadata: unknown;
  coverImageUrl?: string | null;
}): PostShareAssets {
  const imageUrls = collectShareImageUrls({
    coverImageUrl: input.coverImageUrl ?? input.preview.coverImageUrl,
    metadata: input.metadata,
  });

  const caption = buildFacebookShareCaption({
    excerpt: input.preview.excerpt,
    shareUrl: input.shareUrl,
  });

  return {
    caption,
    shareUrl: input.shareUrl,
    featuredImage: imageUrls[0] ?? null,
    images: imageUrls.map((url, index) => ({
      url,
      filename: shareImageFilename(input.preview.postId, index, url),
    })),
  };
}

export function resolveAbsoluteShareImageUrl(
  imageUrl: string | null | undefined,
  siteOrigin: string,
): string | null {
  if (!isValidShareImageUrl(imageUrl)) return null;
  const trimmed = imageUrl.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${siteOrigin.replace(/\/$/, "")}${path}`;
}

export function buildSharePageSocialMetadata(
  preview: PublicSharePreview,
  siteOrigin: string,
): SharePageSocialMetadata {
  const canonical = `${siteOrigin.replace(/\/$/, "")}${preview.sharePagePath}`;
  const description = preview.excerpt.slice(0, 300);
  const ogImage =
    resolveAbsoluteShareImageUrl(preview.coverImageUrl, siteOrigin) ??
    `${siteOrigin.replace(/\/$/, "")}/og-image.jpg`;

  return {
    title: preview.title,
    description,
    canonical,
    ogImage,
  };
}

/** Instructions for manual Facebook group posting (images + caption). */
export const FACEBOOK_GROUP_SHARE_INSTRUCTIONS =
  "Facebook does not reliably attach images when sharing directly into groups. For best results, open the group, create a new post, upload the downloaded images, then paste the Facebook post text.";

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

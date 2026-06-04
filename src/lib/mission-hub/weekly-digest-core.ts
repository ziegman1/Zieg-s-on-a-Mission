import { BLOG_ARTICLES_SPACE_SLUG, BLOG_SOURCE_KIND } from "@/lib/blog/mission-hub-announcement";
import {
  notificationCategoryFromSpaceSettings,
} from "@/lib/community/space-notification-category";
import {
  getCommunityPostBodyPreview,
  truncateBodyForFeedPreview,
} from "@/lib/community/post-preview";
import { isAdminRole } from "@/lib/admin-users";
import { COMMUNITY_POST_AUTHOR_NAME } from "@/lib/community/post-constants";
import { isVoicePrayerBody } from "@/lib/community/prayer-response-body";
import {
  MINISTRY_UPDATES_SPACE_SLUG,
  NEWSLETTER_SOURCE_KIND,
  NEWSLETTER_SPACE_SLUG,
  newsletterPublicPath,
} from "@/lib/newsletter/mission-hub-announcement";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DIGEST_SECTION_ORDER = [
  "prayer_and_praise",
  "ministry_updates",
  "blog_articles",
  "resources",
  "newsletters",
  "community_activity",
] as const;

export type DigestSectionId = (typeof DIGEST_SECTION_ORDER)[number];

export const DIGEST_SECTION_TITLES: Record<DigestSectionId, string> = {
  prayer_and_praise: "Prayer & Praise",
  ministry_updates: "Ministry Updates",
  blog_articles: "Blog Articles",
  resources: "Resources",
  newsletters: "Newsletters",
  community_activity: "Community Activity",
};

export type DigestDateRange = {
  start: string;
  end: string;
};

export type DigestContentItem = {
  id: string;
  kind: "post" | "newsletter" | "comment";
  title: string;
  excerpt: string | null;
  spaceName: string | null;
  spaceSlug: string | null;
  href: string;
  publishedAt: string;
  authorDisplayName: string | null;
  postType?: string;
  isVoicePrayer?: boolean;
};

export type DigestSection = {
  id: DigestSectionId;
  title: string;
  items: DigestContentItem[];
};

export type DigestTotals = {
  prayerRequests: number;
  praiseReports: number;
  encouragementPosts: number;
  ministryUpdates: number;
  blogArticles: number;
  resources: number;
  newsletters: number;
  comments: number;
  voicePrayers: number;
  reactions: number;
  publishedPosts: number;
};

export type WeeklyMissionHubDigest = {
  prepared: true;
  deliveryEnabled: false;
  dateRange: DigestDateRange;
  sections: DigestSection[];
  totals: DigestTotals;
  hasContent: boolean;
  digestEmailRecipientsPrepared: number;
};

export type DigestWindowInput = {
  /** Window end (defaults to now). */
  end?: Date;
  /** Window start (defaults to 7 days before end). */
  start?: Date;
};

export function resolveDigestDateRange(input: DigestWindowInput = {}): { start: Date; end: Date } {
  const end = input.end ?? new Date();
  const start = input.start ?? new Date(end.getTime() - 7 * MS_PER_DAY);
  if (start.getTime() > end.getTime()) {
    throw new Error("Digest start must be before or equal to end.");
  }
  return { start, end };
}

/** @deprecated Use resolveDigestDateRange({ end: referenceDate }). */
export function digestWindow(referenceDate: Date = new Date()): { start: Date; end: Date } {
  return resolveDigestDateRange({ end: referenceDate });
}

export function isWithinDigestWindow(
  publishedAtIso: string,
  input: DigestWindowInput = {},
): boolean {
  const { start, end } = resolveDigestDateRange(input);
  const t = new Date(publishedAtIso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

export function postDigestHref(spaceSlug: string, postId: string): string {
  return `/community/${spaceSlug}#post-${postId}`;
}

export type DigestAuthorUser = {
  name: string | null;
  role: string;
  communityMember: {
    firstName: string;
    lastName: string;
    displayName: string | null;
  } | null;
};

export type DigestPostInput = {
  id: string;
  title: string | null;
  body: string;
  excerpt: string | null;
  postType: string;
  sourceKind: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  space: {
    title: string;
    slug: string;
    spaceType: string;
    settings: unknown;
  };
  authorUser: DigestAuthorUser | null;
};

export type DigestNewsletterInput = {
  id: string;
  title: string;
  subtitle: string;
  excerpt: string;
  slug: string;
  issueDate: Date | null;
  publishedAt: Date;
};

export type DigestCommentInput = {
  id: string;
  body: string;
  displayName: string | null;
  createdAt: Date;
  member: {
    firstName: string;
    lastName: string;
    displayName: string | null;
  } | null;
  post: {
    id: string;
    title: string | null;
    space: { title: string; slug: string };
  };
};

function postPublishedAt(row: Pick<DigestPostInput, "publishedAt" | "createdAt">): string {
  return (row.publishedAt ?? row.createdAt).toISOString();
}

function postExcerpt(row: Pick<DigestPostInput, "body" | "excerpt">): string | null {
  const preview = getCommunityPostBodyPreview(row.body, row.excerpt);
  const text = preview.collapsedPreview.trim();
  return text || null;
}

function postTitle(row: Pick<DigestPostInput, "title" | "postType" | "body" | "excerpt">): string {
  const title = row.title?.trim();
  if (title) return title;
  if (row.postType === "prayer") return "Prayer request";
  if (row.postType === "praise") return "Praise report";
  if (row.postType === "encouragement") return "Encouragement";
  const preview = postExcerpt(row);
  if (preview) return preview.length > 80 ? `${preview.slice(0, 79)}…` : preview;
  return "Mission Hub post";
}

function formatMemberDisplayName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

function commentAuthorName(row: DigestCommentInput): string {
  if (row.displayName?.trim()) return row.displayName.trim();
  if (row.member) {
    return (
      row.member.displayName?.trim() ||
      formatMemberDisplayName(row.member.firstName, row.member.lastName)
    );
  }
  return "Member";
}

export function classifyDigestPostSection(row: DigestPostInput): DigestSectionId | null {
  const slug = row.space.slug.toLowerCase();
  const category = notificationCategoryFromSpaceSettings(row.space.settings);
  const { postType, sourceKind } = row;

  if (slug === NEWSLETTER_SPACE_SLUG || category === "newsletters") {
    if (postType === "newsletter" || sourceKind === NEWSLETTER_SOURCE_KIND) {
      return "newsletters";
    }
  }

  if (
    slug === BLOG_ARTICLES_SPACE_SLUG ||
    sourceKind === BLOG_SOURCE_KIND ||
    category === "blog_articles" ||
    postType === "blog"
  ) {
    return "blog_articles";
  }

  if (slug === "resources" || category === "resources" || postType === "resource") {
    return "resources";
  }

  if (
    slug === MINISTRY_UPDATES_SPACE_SLUG ||
    category === "ministry_updates" ||
    postType === "update" ||
    postType === "behind_the_scenes" ||
    postType === "event" ||
    (sourceKind === NEWSLETTER_SOURCE_KIND && slug === MINISTRY_UPDATES_SPACE_SLUG)
  ) {
    return "ministry_updates";
  }

  if (
    slug.includes("prayer") ||
    row.space.spaceType === "prayer_room" ||
    postType === "prayer" ||
    postType === "praise" ||
    postType === "encouragement" ||
    category === "prayer_requests" ||
    category === "praise_reports"
  ) {
    return "prayer_and_praise";
  }

  if (postType === "newsletter" || sourceKind === NEWSLETTER_SOURCE_KIND) {
    return "newsletters";
  }

  return null;
}

function resolveDigestAuthorName(authorUser: DigestAuthorUser | null): string | null {
  if (!authorUser) return null;
  if (isAdminRole(authorUser.role)) return COMMUNITY_POST_AUTHOR_NAME;
  const member = authorUser.communityMember;
  if (member) {
    const name =
      member.displayName?.trim() ||
      formatMemberDisplayName(member.firstName, member.lastName);
    return name || null;
  }
  return authorUser.name?.trim() || null;
}

export function postRowToDigestItem(row: DigestPostInput): DigestContentItem {
  return {
    id: row.id,
    kind: "post",
    title: postTitle(row),
    excerpt: postExcerpt(row),
    spaceName: row.space.title,
    spaceSlug: row.space.slug,
    href: postDigestHref(row.space.slug, row.id),
    publishedAt: postPublishedAt(row),
    authorDisplayName: resolveDigestAuthorName(row.authorUser),
    postType: row.postType,
  };
}

export function newsletterRowToDigestItem(row: DigestNewsletterInput): DigestContentItem {
  return {
    id: row.id,
    kind: "newsletter",
    title: row.title,
    excerpt: row.excerpt.trim() || row.subtitle.trim() || null,
    spaceName: "Newsletters",
    spaceSlug: NEWSLETTER_SPACE_SLUG,
    href: newsletterPublicPath(row.slug),
    publishedAt: row.publishedAt.toISOString(),
    authorDisplayName: null,
  };
}

export function commentRowToDigestItem(row: DigestCommentInput): DigestContentItem {
  const postLabel = row.post.title?.trim() || "a post";
  const voice = isVoicePrayerBody(row.body);
  const excerpt = voice
    ? "Voice prayer shared"
    : truncateBodyForFeedPreview(row.body.trim(), 160);

  return {
    id: row.id,
    kind: "comment",
    title: voice ? `Voice prayer on ${postLabel}` : `Response on ${postLabel}`,
    excerpt,
    spaceName: row.post.space.title,
    spaceSlug: row.post.space.slug,
    href: postDigestHref(row.post.space.slug, row.post.id),
    publishedAt: row.createdAt.toISOString(),
    authorDisplayName: commentAuthorName(row),
    isVoicePrayer: voice,
  };
}

function emptySections(): Record<DigestSectionId, DigestContentItem[]> {
  return {
    prayer_and_praise: [],
    ministry_updates: [],
    blog_articles: [],
    resources: [],
    newsletters: [],
    community_activity: [],
  };
}

function emptyTotals(): DigestTotals {
  return {
    prayerRequests: 0,
    praiseReports: 0,
    encouragementPosts: 0,
    ministryUpdates: 0,
    blogArticles: 0,
    resources: 0,
    newsletters: 0,
    comments: 0,
    voicePrayers: 0,
    reactions: 0,
    publishedPosts: 0,
  };
}

export type BuildDigestInput = {
  dateRange: DigestDateRange;
  posts: DigestPostInput[];
  newsletters: DigestNewsletterInput[];
  comments: DigestCommentInput[];
  reactionCount: number;
  digestEmailRecipientsPrepared?: number;
};

export function buildWeeklyMissionHubDigest(input: BuildDigestInput): WeeklyMissionHubDigest {
  const sectionItems = emptySections();
  const totals = emptyTotals();

  for (const row of input.posts) {
    const sectionId = classifyDigestPostSection(row);
    if (!sectionId) continue;
    sectionItems[sectionId].push(postRowToDigestItem(row));
    totals.publishedPosts += 1;

    if (sectionId === "prayer_and_praise") {
      if (row.postType === "prayer") totals.prayerRequests += 1;
      else if (row.postType === "praise") totals.praiseReports += 1;
      else if (row.postType === "encouragement") totals.encouragementPosts += 1;
    } else if (sectionId === "ministry_updates") {
      totals.ministryUpdates += 1;
    } else if (sectionId === "blog_articles") {
      totals.blogArticles += 1;
    } else if (sectionId === "resources") {
      totals.resources += 1;
    }
  }

  for (const row of input.newsletters) {
    sectionItems.newsletters.push(newsletterRowToDigestItem(row));
    totals.newsletters += 1;
  }

  for (const row of input.comments) {
    const item = commentRowToDigestItem(row);
    sectionItems.community_activity.push(item);
    totals.comments += 1;
    if (item.isVoicePrayer) totals.voicePrayers += 1;
  }

  totals.reactions = input.reactionCount;

  const sections: DigestSection[] = DIGEST_SECTION_ORDER.map((id) => ({
    id,
    title: DIGEST_SECTION_TITLES[id],
    items: sectionItems[id].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    ),
  }));

  const hasContent = sections.some((section) => section.items.length > 0);

  return {
    prepared: true,
    deliveryEnabled: false,
    dateRange: input.dateRange,
    sections,
    totals,
    hasContent,
    digestEmailRecipientsPrepared: input.digestEmailRecipientsPrepared ?? 0,
  };
}

import type { Prisma } from "@prisma/client";
import { NEWSLETTER_SPACE_SLUG } from "@/lib/newsletter/mission-hub-announcement";

/** Normalize space slug for feed routing (Mission Hub uses lowercase slugs). */
export function normalizeSpaceSlug(slug: string): string {
  return slug.trim().toLowerCase();
}

/** Any published post in the Newsletters space — archive only, never the aggregate All feed. */
export function isNewslettersSpaceSlug(spaceSlug: string): boolean {
  return normalizeSpaceSlug(spaceSlug) === NEWSLETTER_SPACE_SLUG;
}

export function shouldIncludeInHubAllFeed(spaceSlug: string): boolean {
  return !isNewslettersSpaceSlug(spaceSlug);
}

/** Feed item shape for aggregate “All” feed exclusion at render time. */
export type HubAllFeedPostLike = {
  spaceSlug: string;
};

/** @deprecated Use {@link isNewslettersSpaceSlug}. */
export function isNewsletterArchiveHubPost(input: { spaceSlug: string }): boolean {
  return isNewslettersSpaceSlug(input.spaceSlug);
}

/** @deprecated Use {@link isNewslettersSpaceSlug}. */
export function isNewsletterArchiveFeedPost(post: HubAllFeedPostLike): boolean {
  return isNewslettersSpaceSlug(post.spaceSlug);
}

/** Client/server-safe filter for the Mission Hub “All” aggregate feed. */
export function filterHubAllFeedPosts<T extends HubAllFeedPostLike>(posts: T[]): T[] {
  return posts.filter((post) => shouldIncludeInHubAllFeed(post.spaceSlug));
}

const publishedSpace = { status: "published" as const };

/**
 * Prisma where for Mission Hub “All posts”.
 * Excludes every post in the Newsletters space (Ministry Updates announcements remain).
 */
export function hubAllFeedPostWhere(): Prisma.CommunityPostRecordWhereInput {
  return {
    status: "published",
    space: {
      ...publishedSpace,
      slug: { not: NEWSLETTER_SPACE_SLUG },
    },
  };
}

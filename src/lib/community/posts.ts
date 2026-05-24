import type { CommunityPostRecord, CommunitySpaceRecord } from "@prisma/client";
import { COMMUNITY_POST_TYPES, DEFAULT_COMMUNITY_POST_TYPE } from "@/lib/community/post-constants";
import {
  postAuthorUserSelect,
  resolvePostAuthor,
  type PostAuthorUserRow,
} from "@/lib/community/post-author";
import { attachCommentCountsToFeedPosts } from "@/lib/community/comments";
import { attachReactionsToFeedPosts } from "@/lib/community/reactions";
import { interactionFromSpaceRow, spaceExperienceSelect } from "@/lib/community/space-experience";
import { filterHubAllFeedPosts, hubAllFeedPostWhere } from "@/lib/community/feed-filters";
import { attachNewsletterAnnouncementToFeedItem } from "@/lib/newsletter/mission-hub-announcement";
import type { CommunityPostFeedItem, CommunityPostFeedItemBase, CommunityPostType } from "@/lib/community/types";
import { prisma } from "@/lib/db";

const POST_TYPE_VALUES = new Set(COMMUNITY_POST_TYPES.map((t) => t.value));

function parsePostType(value: string | null | undefined): CommunityPostType {
  if (value && POST_TYPE_VALUES.has(value as CommunityPostType)) {
    return value as CommunityPostType;
  }
  return DEFAULT_COMMUNITY_POST_TYPE;
}

type PostWithSpace = CommunityPostRecord & {
  space: Pick<CommunitySpaceRecord, "title" | "slug" | "status"> &
    // slug required for prayer preset fallback on feed items
    Pick<
      CommunitySpaceRecord,
      keyof typeof spaceExperienceSelect
    >;
  authorUser: PostAuthorUserRow | null;
};

const feedPostInclude = {
  space: {
    select: { title: true, slug: true, status: true, ...spaceExperienceSelect },
  },
  authorUser: { select: postAuthorUserSelect },
} as const;

function recordToFeedItem(
  row: PostWithSpace & { sourceKind?: string | null; metadata?: unknown },
): CommunityPostFeedItemBase {
  const publishedAt = row.publishedAt ?? row.createdAt;
  const author = resolvePostAuthor(row.authorUser);
  const interaction = interactionFromSpaceRow(row.space);
  const base: CommunityPostFeedItemBase = {
    id: row.id,
    spaceId: row.spaceId,
    spaceTitle: row.space.title,
    spaceSlug: row.space.slug,
    title: row.title,
    body: row.body,
    excerpt: row.excerpt,
    postType: parsePostType(row.postType),
    coverImageUrl: row.coverImageUrl,
    publishedAt: publishedAt.toISOString(),
    authorName: author.authorName,
    authorImageUrl: author.authorImageUrl,
    authorAvatarName: author.authorAvatarName,
    spaceAllowComments: interaction.allowComments,
    spaceAllowReactions: interaction.allowReactions,
    spaceAllowVoiceMessages: interaction.allowVoiceMessages,
    spaceEngagementPrompt: interaction.engagementPrompt,
    spaceType: interaction.spaceType,
  };
  return attachNewsletterAnnouncementToFeedItem(base, {
    sourceKind: row.sourceKind ?? null,
    metadata: row.metadata ?? {},
  });
}

const publishedPostWhere = {
  status: "published" as const,
  space: { status: "published" as const },
};

export async function listPublishedPostsFeed(
  limit = 50,
  visitorKey?: string,
): Promise<CommunityPostFeedItem[]> {
  const rows = await prisma.communityPostRecord.findMany({
    where: hubAllFeedPostWhere(),
    include: feedPostInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  const withReactions = await attachReactionsToFeedPosts(rows.map(recordToFeedItem), visitorKey);
  const withCounts = await attachCommentCountsToFeedPosts(withReactions);
  return filterHubAllFeedPosts(withCounts);
}

export async function listPublishedPostsBySpaceSlug(
  slug: string,
  limit = 50,
  visitorKey?: string,
): Promise<CommunityPostFeedItem[]> {
  const rows = await prisma.communityPostRecord.findMany({
    where: {
      ...publishedPostWhere,
      space: { slug, status: "published" },
    },
    include: feedPostInclude,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
  });
  const withReactions = await attachReactionsToFeedPosts(rows.map(recordToFeedItem), visitorKey);
  return attachCommentCountsToFeedPosts(withReactions);
}

export async function countPublishedPostsBySpaceIds(
  spaceIds: string[],
): Promise<Record<string, number>> {
  if (spaceIds.length === 0) return {};
  const groups = await prisma.communityPostRecord.groupBy({
    by: ["spaceId"],
    where: {
      spaceId: { in: spaceIds },
      status: "published",
      space: { status: "published" },
    },
    _count: { _all: true },
  });
  return Object.fromEntries(groups.map((g) => [g.spaceId, g._count._all]));
}

export async function listAllCommunityPostsForAdmin(): Promise<
  (CommunityPostRecord & { space: Pick<CommunitySpaceRecord, "title" | "slug"> })[]
> {
  return prisma.communityPostRecord.findMany({
    include: { space: { select: { title: true, slug: true } } },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function getCommunityPostByIdForAdmin(
  id: string,
): Promise<(CommunityPostRecord & { space: Pick<CommunitySpaceRecord, "title" | "slug"> }) | null> {
  return prisma.communityPostRecord.findUnique({
    where: { id },
    include: { space: { select: { title: true, slug: true } } },
  });
}

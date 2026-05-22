import { COMMUNITY_REACTION_TYPES } from "@/lib/community/types";
import type { CommunityReactionType, ReactionCounts } from "@/lib/community/types";
import { prisma } from "@/lib/db";

export function emptyReactionCounts(): ReactionCounts {
  return Object.fromEntries(
    COMMUNITY_REACTION_TYPES.map((t) => [t, 0]),
  ) as ReactionCounts;
}

export function isCommunityReactionType(value: string): value is CommunityReactionType {
  return (COMMUNITY_REACTION_TYPES as readonly string[]).includes(value);
}

const publishedPostWhere = {
  status: "published" as const,
  space: { status: "published" as const },
};

export async function isPublishedPostForReactions(postId: string): Promise<boolean> {
  const count = await prisma.communityPostRecord.count({
    where: { id: postId, ...publishedPostWhere },
  });
  return count > 0;
}

export async function getReactionCountsForPost(postId: string): Promise<ReactionCounts> {
  const groups = await prisma.communityPostReactionRecord.groupBy({
    by: ["reactionType"],
    where: { postId },
    _count: { _all: true },
  });
  const counts = emptyReactionCounts();
  for (const g of groups) {
    if (isCommunityReactionType(g.reactionType)) {
      counts[g.reactionType] = g._count._all;
    }
  }
  return counts;
}

export async function getVisitorReactionsForPost(
  postId: string,
  visitorKey: string,
): Promise<CommunityReactionType[]> {
  const rows = await prisma.communityPostReactionRecord.findMany({
    where: { postId, visitorKey },
    select: { reactionType: true },
  });
  return rows
    .map((r) => r.reactionType)
    .filter((t): t is CommunityReactionType => isCommunityReactionType(t));
}

export async function attachReactionsToFeedPosts<T extends { id: string }>(
  posts: T[],
  visitorKey: string | undefined,
): Promise<(T & { reactionCounts: ReactionCounts; myReactions: CommunityReactionType[] })[]> {
  if (posts.length === 0) return [];

  const postIds = posts.map((p) => p.id);
  const groups = await prisma.communityPostReactionRecord.groupBy({
    by: ["postId", "reactionType"],
    where: { postId: { in: postIds } },
    _count: { _all: true },
  });
  const mineRows =
    visitorKey && visitorKey.length > 0
      ? await prisma.communityPostReactionRecord.findMany({
          where: { postId: { in: postIds }, visitorKey },
          select: { postId: true, reactionType: true },
        })
      : [];

  const countsByPost = new Map<string, ReactionCounts>();
  for (const id of postIds) countsByPost.set(id, emptyReactionCounts());
  for (const g of groups) {
    if (!isCommunityReactionType(g.reactionType)) continue;
    const c = countsByPost.get(g.postId) ?? emptyReactionCounts();
    c[g.reactionType] = g._count._all;
    countsByPost.set(g.postId, c);
  }

  const mineByPost = new Map<string, CommunityReactionType[]>();
  for (const row of mineRows) {
    if (!isCommunityReactionType(row.reactionType)) continue;
    const list = mineByPost.get(row.postId) ?? [];
    list.push(row.reactionType);
    mineByPost.set(row.postId, list);
  }

  return posts.map((post) => ({
    ...post,
    reactionCounts: countsByPost.get(post.id) ?? emptyReactionCounts(),
    myReactions: mineByPost.get(post.id) ?? [],
  }));
}

export async function togglePostReaction(
  postId: string,
  visitorKey: string,
  reactionType: CommunityReactionType,
): Promise<{
  counts: ReactionCounts;
  myReactions: CommunityReactionType[];
  added: boolean;
}> {
  const existing = await prisma.communityPostReactionRecord.findUnique({
    where: {
      postId_visitorKey_reactionType: {
        postId,
        visitorKey,
        reactionType,
      },
    },
  });

  if (existing) {
    await prisma.communityPostReactionRecord.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.communityPostReactionRecord.create({
      data: { postId, visitorKey, reactionType },
    });
  }

  const [counts, myReactions] = await Promise.all([
    getReactionCountsForPost(postId),
    getVisitorReactionsForPost(postId, visitorKey),
  ]);

  return { counts, myReactions, added: !existing };
}

/**
 * Facebook-style single reaction per visitor: set type or clear if already the only active type.
 */
export async function setPostReaction(
  postId: string,
  visitorKey: string,
  reactionType: CommunityReactionType,
): Promise<{
  counts: ReactionCounts;
  myReactions: CommunityReactionType[];
  active: boolean;
  added: boolean;
}> {
  const mine = await getVisitorReactionsForPost(postId, visitorKey);
  const togglingOff = mine.length === 1 && mine[0] === reactionType;

  await prisma.communityPostReactionRecord.deleteMany({
    where: { postId, visitorKey },
  });

  if (!togglingOff) {
    await prisma.communityPostReactionRecord.create({
      data: { postId, visitorKey, reactionType },
    });
  }

  const [counts, myReactions] = await Promise.all([
    getReactionCountsForPost(postId),
    getVisitorReactionsForPost(postId, visitorKey),
  ]);

  return {
    counts,
    myReactions,
    active: !togglingOff,
    added: !togglingOff && !mine.includes(reactionType),
  };
}

export type PostReactionDetail = {
  reactionType: CommunityReactionType;
  displayName: string;
  createdAt: string;
};

export async function listPostReactionDetails(
  postId: string,
): Promise<PostReactionDetail[]> {
  const rows = await prisma.communityPostReactionRecord.findMany({
    where: { postId },
    orderBy: { createdAt: "desc" },
    select: { reactionType: true, visitorKey: true, createdAt: true },
  });

  const keys = [...new Set(rows.map((r) => r.visitorKey))];
  const members =
    keys.length > 0
      ? await prisma.communityMemberRecord.findMany({
          where: { visitorKey: { in: keys } },
          select: { visitorKey: true, firstName: true, lastName: true },
        })
      : [];

  const nameByKey = new Map(
    members.map((m) => [
      m.visitorKey,
      `${m.firstName.trim()} ${m.lastName.trim()}`.trim() || "Member",
    ]),
  );

  const result: PostReactionDetail[] = [];
  for (const row of rows) {
    if (!isCommunityReactionType(row.reactionType)) continue;
    result.push({
      reactionType: row.reactionType,
      displayName: nameByKey.get(row.visitorKey) ?? "Someone",
      createdAt: row.createdAt.toISOString(),
    });
  }
  return result;
}

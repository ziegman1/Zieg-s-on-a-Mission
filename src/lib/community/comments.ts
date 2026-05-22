import type { CommunityMemberRecord, CommunityPostCommentRecord } from "@prisma/client";
import { formatMemberDisplayName, ownerCommentDisplayName } from "@/lib/community/members";
import type { CommunityOwner } from "@/lib/community/owner-types";
import { prisma } from "@/lib/db";
import type {
  CommunityCommentStatus,
  CommunityPostComment,
  CommunityPostCommentThread,
} from "@/lib/community/types";

export const COMMUNITY_COMMENT_STATUSES = ["published", "hidden", "archived"] as const;

export function isCommunityCommentStatus(value: string): value is CommunityCommentStatus {
  return (COMMUNITY_COMMENT_STATUSES as readonly string[]).includes(value);
}

const publishedPostWhere = {
  status: "published" as const,
  space: { status: "published" as const },
};

const publishedCommentWhere = { status: "published" as const };

const commentInclude = {
  member: {
    select: {
      firstName: true,
      lastName: true,
      profileImageUrl: true,
      status: true,
    },
  },
} as const;

type CommentRow = CommunityPostCommentRecord & {
  member: Pick<
    CommunityMemberRecord,
    "firstName" | "lastName" | "profileImageUrl" | "status"
  > | null;
};

/** ADMIN/STAFF display names → User.image for owner comments (no member_id on row). */
async function loadOwnerCommentAvatarsByDisplayName(): Promise<Map<string, string | null>> {
  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    select: { name: true, email: true, image: true },
  });
  const map = new Map<string, string | null>();
  for (const user of users) {
    const owner: CommunityOwner = {
      id: "",
      email: user.email,
      name: user.name,
      role: "ADMIN",
    };
    const image = user.image ?? null;
    const keys = new Set<string>();
    const name = user.name?.trim();
    if (name) keys.add(name);
    keys.add(ownerCommentDisplayName(owner));
    const email = user.email?.trim();
    if (email) keys.add(email.split("@")[0] ?? "");
    for (const key of keys) {
      if (key) map.set(key, image);
    }
  }
  return map;
}

function resolveCommentDisplay(
  row: CommentRow,
  ownerAvatars?: Map<string, string | null>,
): {
  displayName: string;
  profileImageUrl: string | null;
} {
  if (row.member && row.member.status === "active") {
    return {
      displayName: formatMemberDisplayName(row.member.firstName, row.member.lastName),
      profileImageUrl: row.member.profileImageUrl,
    };
  }
  const displayName = row.displayName ?? "Guest";
  const ownerImage =
    !row.memberId && ownerAvatars?.has(displayName)
      ? (ownerAvatars.get(displayName) ?? null)
      : null;
  return {
    displayName,
    profileImageUrl: ownerImage,
  };
}

export async function isPublishedPostForComments(postId: string): Promise<boolean> {
  const count = await prisma.communityPostRecord.count({
    where: { id: postId, ...publishedPostWhere },
  });
  return count > 0;
}

function recordToComment(
  row: CommentRow,
  ownerAvatars?: Map<string, string | null>,
): CommunityPostComment {
  const { displayName, profileImageUrl } = resolveCommentDisplay(row, ownerAvatars);
  return {
    id: row.id,
    postId: row.postId,
    parentCommentId: row.parentCommentId,
    visitorKey: row.visitorKey,
    displayName,
    profileImageUrl,
    body: row.body,
    status: isCommunityCommentStatus(row.status) ? row.status : "published",
    createdAt: row.createdAt.toISOString(),
  };
}

export function buildCommentThreads(rows: CommunityPostComment[]): CommunityPostCommentThread[] {
  const topLevel = rows
    .filter((c) => !c.parentCommentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const repliesByParent = new Map<string, CommunityPostComment[]>();
  for (const c of rows) {
    if (!c.parentCommentId) continue;
    const list = repliesByParent.get(c.parentCommentId) ?? [];
    list.push(c);
    repliesByParent.set(c.parentCommentId, list);
  }
  for (const list of repliesByParent.values()) {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  return topLevel.map((comment) => ({
    comment,
    replies: repliesByParent.get(comment.id) ?? [],
  }));
}

const moderatorVisibleCommentWhere = {
  status: { in: ["published", "hidden"] },
};

export async function listCommentsForPost(
  postId: string,
  options?: { includeHiddenForModerator?: boolean },
): Promise<CommunityPostCommentThread[]> {
  const statusWhere = options?.includeHiddenForModerator
    ? moderatorVisibleCommentWhere
    : publishedCommentWhere;

  const [rows, ownerAvatars] = await Promise.all([
    prisma.communityPostCommentRecord.findMany({
      where: { postId, ...statusWhere },
      orderBy: { createdAt: "desc" },
      include: commentInclude,
    }),
    loadOwnerCommentAvatarsByDisplayName(),
  ]);
  return buildCommentThreads(rows.map((row) => recordToComment(row, ownerAvatars)));
}

export async function listPublishedCommentsForPost(
  postId: string,
): Promise<CommunityPostCommentThread[]> {
  return listCommentsForPost(postId);
}

export async function countPublishedCommentsForPost(postId: string): Promise<number> {
  return prisma.communityPostCommentRecord.count({
    where: { postId, ...publishedCommentWhere },
  });
}

export async function countPublishedCommentsForPosts(
  postIds: string[],
): Promise<Record<string, number>> {
  if (postIds.length === 0) return {};
  const groups = await prisma.communityPostCommentRecord.groupBy({
    by: ["postId"],
    where: { postId: { in: postIds }, ...publishedCommentWhere },
    _count: { _all: true },
  });
  return Object.fromEntries(groups.map((g) => [g.postId, g._count._all]));
}

export async function attachCommentCountsToFeedPosts<T extends { id: string }>(
  posts: T[],
): Promise<(T & { commentCount: number })[]> {
  if (posts.length === 0) return [];
  const counts = await countPublishedCommentsForPosts(posts.map((p) => p.id));
  return posts.map((post) => ({
    ...post,
    commentCount: counts[post.id] ?? 0,
  }));
}

export async function createPublishedComment(input: {
  postId: string;
  visitorKey: string;
  displayName: string;
  body: string;
  memberId?: string | null;
  parentCommentId?: string | null;
}): Promise<{ comment: CommunityPostComment; commentCount: number }> {
  const name = input.displayName.trim();
  if (!name) throw new Error("Display name is required");
  const body = input.body.trim();
  if (!body || body.length > 2000) throw new Error("Comment is too long or empty");

  if (input.parentCommentId) {
    const parent = await prisma.communityPostCommentRecord.findFirst({
      where: {
        id: input.parentCommentId,
        postId: input.postId,
        ...publishedCommentWhere,
        parentCommentId: null,
      },
    });
    if (!parent) throw new Error("Cannot reply to this comment");
  }

  const row = await prisma.communityPostCommentRecord.create({
    data: {
      postId: input.postId,
      visitorKey: input.visitorKey,
      displayName: name,
      memberId: input.memberId ?? null,
      body,
      parentCommentId: input.parentCommentId ?? null,
      status: "published",
    },
    include: commentInclude,
  });

  const [commentCount, ownerAvatars] = await Promise.all([
    prisma.communityPostCommentRecord.count({
      where: { postId: input.postId, ...publishedCommentWhere },
    }),
    input.memberId ? Promise.resolve(undefined) : loadOwnerCommentAvatarsByDisplayName(),
  ]);

  return { comment: recordToComment(row, ownerAvatars), commentCount };
}

export type AdminCommunityCommentRow = {
  id: string;
  postId: string;
  postTitle: string | null;
  spaceTitle: string;
  spaceSlug: string;
  parentCommentId: string | null;
  displayName: string;
  body: string;
  status: CommunityCommentStatus;
  createdAt: string;
  updatedAt: string;
};

export async function listAllCommentsForAdmin(): Promise<AdminCommunityCommentRow[]> {
  const rows = await prisma.communityPostCommentRecord.findMany({
    include: {
      member: { select: { firstName: true, lastName: true, status: true } },
      post: {
        select: {
          title: true,
          space: { select: { title: true, slug: true } },
        },
      },
    },
    orderBy: [{ createdAt: "desc" }],
    take: 500,
  });

  return rows.map((row) => {
    const displayName =
      row.member && row.member.status === "active"
        ? formatMemberDisplayName(row.member.firstName, row.member.lastName)
        : (row.displayName ?? "Guest");
    return {
      id: row.id,
      postId: row.postId,
      postTitle: row.post.title,
      spaceTitle: row.post.space.title,
      spaceSlug: row.post.space.slug,
      parentCommentId: row.parentCommentId,
      displayName,
      body: row.body,
      status: isCommunityCommentStatus(row.status) ? row.status : "published",
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function setCommentStatusForAdmin(
  commentId: string,
  status: CommunityCommentStatus,
): Promise<boolean> {
  const existing = await prisma.communityPostCommentRecord.findUnique({
    where: { id: commentId },
    select: { id: true },
  });
  if (!existing) return false;
  await prisma.communityPostCommentRecord.update({
    where: { id: commentId },
    data: { status },
  });
  return true;
}

type CommentModerationPostRef = {
  postId: string;
  spaceSlug: string | null;
};

async function getCommentPostRef(
  commentId: string,
): Promise<CommentModerationPostRef | null> {
  const row = await prisma.communityPostCommentRecord.findUnique({
    where: { id: commentId },
    select: {
      postId: true,
      post: { select: { space: { select: { slug: true } } } },
    },
  });
  if (!row) return null;
  return { postId: row.postId, spaceSlug: row.post.space.slug };
}

export async function hideCommunityComment(
  commentId: string,
): Promise<CommentModerationPostRef | null> {
  const ref = await getCommentPostRef(commentId);
  if (!ref) return null;
  await prisma.communityPostCommentRecord.update({
    where: { id: commentId },
    data: { status: "hidden" },
  });
  return ref;
}

export async function restoreCommunityComment(
  commentId: string,
): Promise<CommentModerationPostRef | null> {
  const ref = await getCommentPostRef(commentId);
  if (!ref) return null;
  await prisma.communityPostCommentRecord.update({
    where: { id: commentId },
    data: { status: "published" },
  });
  return ref;
}

/** Permanently removes the comment row (replies cascade when deleting a parent). */
export async function deleteCommunityComment(
  commentId: string,
): Promise<CommentModerationPostRef | null> {
  const ref = await getCommentPostRef(commentId);
  if (!ref) return null;
  await prisma.communityPostCommentRecord.delete({
    where: { id: commentId },
  });
  return ref;
}

export async function loadCommentsAfterModeration(
  postId: string,
  includeHiddenForModerator: boolean,
): Promise<{
  threads: CommunityPostCommentThread[];
  commentCount: number;
}> {
  const [threads, commentCount] = await Promise.all([
    listCommentsForPost(postId, { includeHiddenForModerator }),
    countPublishedCommentsForPost(postId),
  ]);
  return { threads, commentCount };
}

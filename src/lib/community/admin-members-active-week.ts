import "server-only";

import { startOfSiteDay } from "@/lib/community/site-timezone";
import { prisma } from "@/lib/db";

export const ACTIVE_MEMBER_WINDOW_DAYS = 7;

export function activeMemberWindowStart(now = Date.now()): Date {
  return new Date(now - ACTIVE_MEMBER_WINDOW_DAYS * 86_400_000);
}

export type ActiveMemberActivityInput = {
  profileUpdatedMemberIds: string[];
  commentMemberIds: (string | null | undefined)[];
  postAuthorUserIds: (string | null | undefined)[];
  reactionVisitorKeys: string[];
  membersByUserId: { id: string; userId: string }[];
  membersByVisitorKey: { id: string; visitorKey: string }[];
};

/** Count unique active members from pre-aggregated activity signals (testable). */
export function countActiveMembersFromActivity(input: ActiveMemberActivityInput): number {
  const memberIds = new Set<string>();

  for (const id of input.profileUpdatedMemberIds) {
    if (id) memberIds.add(id);
  }

  for (const id of input.commentMemberIds) {
    if (id) memberIds.add(id);
  }

  const userIdToMember = new Map(
    input.membersByUserId.map((row) => [row.userId, row.id]),
  );
  for (const userId of input.postAuthorUserIds) {
    if (!userId) continue;
    const memberId = userIdToMember.get(userId);
    if (memberId) memberIds.add(memberId);
  }

  const visitorKeyToMember = new Map(
    input.membersByVisitorKey.map((row) => [row.visitorKey, row.id]),
  );
  for (const visitorKey of input.reactionVisitorKeys) {
    if (!visitorKey) continue;
    const memberId = visitorKeyToMember.get(visitorKey);
    if (memberId) memberIds.add(memberId);
  }

  return memberIds.size;
}

export async function gatherMemberEngagementSignals(since: Date) {
  const [profileUpdated, commentMembers, postAuthors, reactionKeys] = await Promise.all([
    prisma.communityMemberRecord.findMany({
      where: { status: "active", updatedAt: { gte: since } },
      select: { id: true },
    }),
    prisma.communityPostCommentRecord.findMany({
      where: {
        createdAt: { gte: since },
        status: "published",
        memberId: { not: null },
      },
      select: { memberId: true },
      distinct: ["memberId"],
    }),
    prisma.communityPostRecord.findMany({
      where: {
        status: "published",
        authorUserId: { not: null },
        OR: [{ publishedAt: { gte: since } }, { updatedAt: { gte: since } }],
      },
      select: { authorUserId: true },
      distinct: ["authorUserId"],
    }),
    prisma.communityPostReactionRecord.findMany({
      where: { createdAt: { gte: since } },
      select: { visitorKey: true },
      distinct: ["visitorKey"],
    }),
  ]);

  const authorUserIds = postAuthors
    .map((row) => row.authorUserId)
    .filter((id): id is string => Boolean(id));
  const reactionVisitorKeys = reactionKeys.map((row) => row.visitorKey);

  const linkedMembers =
    authorUserIds.length > 0 || reactionVisitorKeys.length > 0
      ? await prisma.communityMemberRecord.findMany({
          where: {
            status: "active",
            OR: [
              ...(authorUserIds.length > 0
                ? [{ userId: { in: authorUserIds } }]
                : []),
              ...(reactionVisitorKeys.length > 0
                ? [{ visitorKey: { in: reactionVisitorKeys } }]
                : []),
            ],
          },
          select: { id: true, userId: true, visitorKey: true },
        })
      : [];

  return {
    profileUpdatedMemberIds: profileUpdated.map((row) => row.id),
    commentMemberIds: commentMembers.map((row) => row.memberId),
    postAuthorUserIds: authorUserIds,
    reactionVisitorKeys,
    membersByUserId: linkedMembers
      .filter((row): row is typeof row & { userId: string } => Boolean(row.userId))
      .map((row) => ({ id: row.id, userId: row.userId })),
    membersByVisitorKey: linkedMembers
      .filter((row): row is typeof row & { visitorKey: string } => Boolean(row.visitorKey))
      .map((row) => ({ id: row.id, visitorKey: row.visitorKey })),
  };
}

export async function countEngagedMembersSince(since: Date): Promise<number> {
  const signals = await gatherMemberEngagementSignals(since);
  return countActiveMembersFromActivity(signals);
}

/** Unique engaged members since the start of today in America/Chicago. */
export async function countEngagedMembersToday(now = Date.now()): Promise<number> {
  return countEngagedMembersSince(startOfSiteDay(now));
}

/** Unique active members in the last 7 days (comments, posts, reactions, profile updates). */
export async function countActiveMembersThisWeek(): Promise<number> {
  return countEngagedMembersSince(activeMemberWindowStart());
}

import "server-only";

import { prisma } from "@/lib/db";

export type CommunityAdminStats = {
  spaceCount: number;
  postCount: number;
  commentCount: number;
  memberCount: number;
  activeMemberCount: number;
};

export async function getCommunityAdminStats(): Promise<CommunityAdminStats> {
  const [spaceCount, postCount, commentCount, memberCount, activeMemberCount] =
    await Promise.all([
      prisma.communitySpaceRecord.count(),
      prisma.communityPostRecord.count({
        where: { status: { not: "archived" } },
      }),
      prisma.communityPostCommentRecord.count(),
      prisma.communityMemberRecord.count(),
      prisma.communityMemberRecord.count({ where: { status: "active" } }),
    ]);

  return {
    spaceCount,
    postCount,
    commentCount,
    memberCount,
    activeMemberCount,
  };
}

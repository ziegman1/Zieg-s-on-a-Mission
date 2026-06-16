import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  countEngagedMembersSince,
  countEngagedMembersToday,
  countActiveMembersFromActivity,
} from "./admin-members-active-week";
import { startOfSiteDay } from "./site-timezone";

vi.mock("@/lib/db", () => ({
  prisma: {
    communityMemberRecord: {
      findMany: vi.fn(),
    },
    communityPostCommentRecord: {
      findMany: vi.fn(),
    },
    communityPostRecord: {
      findMany: vi.fn(),
    },
    communityPostReactionRecord: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

const memberFindMany = vi.mocked(prisma.communityMemberRecord.findMany);
const commentFindMany = vi.mocked(prisma.communityPostCommentRecord.findMany);
const postFindMany = vi.mocked(prisma.communityPostRecord.findMany);
const reactionFindMany = vi.mocked(prisma.communityPostReactionRecord.findMany);

describe("engaged today", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes reactions and posts in engaged member count", async () => {
    memberFindMany
      .mockResolvedValueOnce([{ id: "m-profile" }] as never)
      .mockResolvedValueOnce([
        { id: "m-post", userId: "u-post", visitorKey: "vk-react" },
      ] as never);
    commentFindMany.mockResolvedValue([{ memberId: "m-comment" }] as never);
    postFindMany.mockResolvedValue([{ authorUserId: "u-post" }] as never);
    reactionFindMany.mockResolvedValue([{ visitorKey: "vk-react" }] as never);

    const count = await countEngagedMembersSince(new Date("2026-06-15T05:00:00.000Z"));

    expect(count).toBe(3);
    expect(
      countActiveMembersFromActivity({
        profileUpdatedMemberIds: ["m-profile"],
        commentMemberIds: ["m-comment"],
        postAuthorUserIds: ["u-post"],
        reactionVisitorKeys: ["vk-react"],
        membersByUserId: [{ id: "m-post", userId: "u-post" }],
        membersByVisitorKey: [{ id: "m-post", visitorKey: "vk-react" }],
      }),
    ).toBe(3);
  });

  it("uses America/Chicago start-of-day boundary for engaged today", async () => {
    memberFindMany.mockResolvedValue([] as never);
    commentFindMany.mockResolvedValue([] as never);
    postFindMany.mockResolvedValue([] as never);
    reactionFindMany.mockResolvedValue([] as never);

    const now = Date.parse("2026-06-16T01:30:00.000Z");
    await countEngagedMembersToday(now);

    const expectedSince = startOfSiteDay(now);
    expect(commentFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { gte: expectedSince },
        }),
      }),
    );
    expect(expectedSince.toISOString()).toBe("2026-06-15T05:00:00.000Z");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getHubVisitStatsToday,
  recordCommunityHubVisit,
  shouldRecordHubVisit,
} from "./hub-activity-events";
import { startOfSiteDay } from "./site-timezone";

vi.mock("@/lib/db", () => ({
  prisma: {
    communityHubActivityEventRecord: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

const hubEvents = vi.mocked(prisma.communityHubActivityEventRecord);

describe("hub activity visit events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shouldRecordHubVisit excludes login and join", () => {
    expect(shouldRecordHubVisit("/community/login")).toBe(false);
    expect(shouldRecordHubVisit("/community/join")).toBe(false);
    expect(shouldRecordHubVisit("/community")).toBe(true);
  });

  it("creates a visit record for a signed-in member", async () => {
    hubEvents.findFirst.mockResolvedValue(null);
    hubEvents.create.mockResolvedValue({ id: "evt-1" } as never);

    const created = await recordCommunityHubVisit({
      path: "/community",
      memberId: "member-1",
      userId: "user-1",
    });

    expect(created).toBe(true);
    expect(hubEvents.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "VISIT",
        memberId: "member-1",
        userId: "user-1",
        path: "/community",
      }),
    });
  });

  it("dedupes same member and path within 15 minutes", async () => {
    hubEvents.findFirst.mockResolvedValue({ id: "existing" } as never);

    const created = await recordCommunityHubVisit({
      path: "/community",
      memberId: "member-1",
      userId: "user-1",
    });

    expect(created).toBe(false);
    expect(hubEvents.create).not.toHaveBeenCalled();
    expect(hubEvents.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          eventType: "VISIT",
          path: "/community",
          memberId: "member-1",
        }),
      }),
    );
  });

  it("creates separate visits for different paths", async () => {
    hubEvents.findFirst.mockResolvedValue(null);
    hubEvents.create.mockResolvedValue({ id: "evt-2" } as never);

    await recordCommunityHubVisit({
      path: "/community/spaces/prayer",
      memberId: "member-1",
      userId: "user-1",
    });

    expect(hubEvents.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ path: "/community/spaces/prayer" }),
      }),
    );
    expect(hubEvents.create).toHaveBeenCalled();
  });

  it("returns visits today and unique member visits today for admin preview", async () => {
    const now = Date.parse("2026-06-16T12:00:00.000Z");
    hubEvents.count.mockResolvedValue(5);
    hubEvents.groupBy.mockResolvedValue([
      { memberId: "m-1" },
      { memberId: "m-2" },
    ] as never);

    const stats = await getHubVisitStatsToday(now);

    expect(stats).toEqual({ visitsToday: 5, uniqueMembersVisitedToday: 2 });
    expect(hubEvents.count).toHaveBeenCalledWith({
      where: {
        eventType: "VISIT",
        createdAt: { gte: startOfSiteDay(now) },
      },
    });
  });

  it("does not record anonymous visits without a visitor key", async () => {
    const created = await recordCommunityHubVisit({
      path: "/community",
    });

    expect(created).toBe(false);
    expect(hubEvents.findFirst).not.toHaveBeenCalled();
    expect(hubEvents.create).not.toHaveBeenCalled();
  });
});

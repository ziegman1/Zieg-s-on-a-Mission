import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    newsletter: { findMany: vi.fn() },
    communityPostRecord: { findMany: vi.fn() },
    communityMemberRecord: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/community/user-notification-prefs", () => ({
  getUserNotificationPreferences: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/community/settings-types";
import {
  digestWindow,
  isWithinDigestWindow,
  prepareWeeklyMissionHubDigest,
} from "./weekly-digest-prep";

describe("weekly digest preparation", () => {
  const ref = new Date("2026-06-10T12:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([]);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it("collects newsletters and posts from the past 7 days with links", async () => {
    const { start } = digestWindow(ref);

    vi.mocked(prisma.newsletter.findMany).mockResolvedValue([
      {
        id: "nl_1",
        title: "June letter",
        subtitle: "",
        excerpt: "Highlights",
        slug: "june-letter",
        issueDate: null,
        publishedAt: new Date("2026-06-08T00:00:00.000Z"),
      },
    ] as never);

    vi.mocked(prisma.communityPostRecord.findMany).mockResolvedValue([
      {
        id: "post-1",
        title: "Ministry note",
        excerpt: "Update",
        postType: "newsletter",
        sourceKind: "newsletter",
        publishedAt: new Date("2026-06-09T00:00:00.000Z"),
        createdAt: new Date("2026-06-09T00:00:00.000Z"),
        space: { title: "Ministry Updates", slug: "ministry-updates" },
      },
      {
        id: "post-2",
        title: "Prayer",
        excerpt: null,
        postType: "prayer",
        sourceKind: null,
        publishedAt: new Date("2026-06-07T00:00:00.000Z"),
        createdAt: new Date("2026-06-07T00:00:00.000Z"),
        space: { title: "Prayer Room", slug: "prayer-and-praise-room" },
      },
    ] as never);

    const digest = await prepareWeeklyMissionHubDigest(ref);

    expect(digest.deliveryEnabled).toBe(false);
    expect(digest.newsletters).toHaveLength(1);
    expect(digest.newsletters[0].path).toBe("/newsletters/june-letter");
    expect(digest.ministryUpdates).toHaveLength(1);
    expect(digest.hubPosts).toHaveLength(1);
    expect(digest.periodStart).toBe(start.toISOString());

    expect(prisma.newsletter.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PUBLISHED",
          publishedAt: expect.objectContaining({ gte: start }),
        }),
      }),
    );
  });

  it("excludes items outside the digest window", () => {
    const old = "2026-05-01T00:00:00.000Z";
    const recent = "2026-06-08T00:00:00.000Z";
    expect(isWithinDigestWindow(old, ref)).toBe(false);
    expect(isWithinDigestWindow(recent, ref)).toBe(true);
  });
});

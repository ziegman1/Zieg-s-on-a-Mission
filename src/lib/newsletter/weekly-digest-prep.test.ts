import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    newsletter: { findMany: vi.fn() },
    communityPostRecord: { findMany: vi.fn() },
    communityPostCommentRecord: { findMany: vi.fn() },
    communityPostReactionRecord: { count: vi.fn() },
    communityMemberRecord: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/mission-hub/weekly-digest-recipients", () => ({
  countWeeklyDigestEmailRecipients: vi.fn().mockResolvedValue(0),
}));

import { prisma } from "@/lib/db";
import { prepareWeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest";
import {
  digestWindow,
  isWithinDigestWindow,
} from "@/lib/mission-hub/weekly-digest-core";

describe("weekly digest preparation", () => {
  const ref = new Date("2026-06-10T12:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([]);
    vi.mocked(prisma.communityPostCommentRecord.findMany).mockResolvedValue([]);
    vi.mocked(prisma.communityPostReactionRecord.count).mockResolvedValue(0);
  });

  it("collects newsletters and posts into grouped sections", async () => {
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
        body: "Update body",
        excerpt: "Update",
        postType: "update",
        sourceKind: "newsletter",
        publishedAt: new Date("2026-06-09T00:00:00.000Z"),
        createdAt: new Date("2026-06-09T00:00:00.000Z"),
        space: {
          title: "Ministry Updates",
          slug: "ministry-updates",
          spaceType: "standard",
          settings: { notificationCategory: "ministry_updates" },
        },
        authorUser: null,
      },
      {
        id: "post-2",
        title: "Prayer",
        body: "Please pray",
        excerpt: null,
        postType: "prayer",
        sourceKind: null,
        publishedAt: new Date("2026-06-07T00:00:00.000Z"),
        createdAt: new Date("2026-06-07T00:00:00.000Z"),
        space: {
          title: "Prayer Room",
          slug: "prayer-and-praise-room",
          spaceType: "prayer_room",
          settings: {},
        },
        authorUser: null,
      },
    ] as never);

    const digest = await prepareWeeklyMissionHubDigest(ref);

    expect(digest.deliveryEnabled).toBe(false);
    expect(digest.dateRange.start).toBe(start.toISOString());
    expect(digest.hasContent).toBe(true);

    const newsletters = digest.sections.find((s) => s.id === "newsletters");
    const ministry = digest.sections.find((s) => s.id === "ministry_updates");
    const prayer = digest.sections.find((s) => s.id === "prayer_and_praise");

    expect(newsletters?.items).toHaveLength(1);
    expect(newsletters?.items[0].href).toBe("/newsletters/june-letter");
    expect(ministry?.items).toHaveLength(1);
    expect(prayer?.items).toHaveLength(1);

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
    const end = ref;
    const start = digestWindow(ref).start;
    const old = "2026-05-01T00:00:00.000Z";
    const recent = "2026-06-08T00:00:00.000Z";
    expect(isWithinDigestWindow(old, { start, end })).toBe(false);
    expect(isWithinDigestWindow(recent, { start, end })).toBe(true);
  });
});

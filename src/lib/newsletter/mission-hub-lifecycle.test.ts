import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    communityPostRecord: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    communityNotificationRecord: {
      count: vi.fn(),
      deleteMany: vi.fn(),
    },
    missionHubEmailDeliveryRecord: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("./mission-hub-announcement", () => ({
  NEWSLETTER_SOURCE_KIND: "newsletter",
  archiveMissionHubNewsletterAnnouncement: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { archiveMissionHubNewsletterAnnouncement } from "./mission-hub-announcement";
import {
  getNewsletterMissionHubDiagnostics,
  removeNewsletterFromMissionHub,
} from "./mission-hub-lifecycle";

describe("removeNewsletterFromMissionHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(archiveMissionHubNewsletterAnnouncement).mockResolvedValue(2);
    vi.mocked(prisma.communityNotificationRecord.deleteMany).mockResolvedValue({
      count: 5,
    });
    vi.mocked(prisma.missionHubEmailDeliveryRecord.deleteMany).mockResolvedValue({
      count: 3,
    });
  });

  it("archives posts and clears notification and email dedupe by default", async () => {
    const result = await removeNewsletterFromMissionHub("nl_1");

    expect(archiveMissionHubNewsletterAnnouncement).toHaveBeenCalledWith("nl_1");
    expect(prisma.communityNotificationRecord.deleteMany).toHaveBeenCalledWith({
      where: { dedupeKey: "newsletter:nl_1:published" },
    });
    expect(prisma.missionHubEmailDeliveryRecord.deleteMany).toHaveBeenCalledWith({
      where: { dedupeKey: "newsletter:nl_1:email" },
    });
    expect(result).toEqual({
      postsArchived: 2,
      notificationsDeleted: 5,
      emailDeliveriesDeleted: 3,
    });
  });

  it("can skip clearing delivery logs when requested", async () => {
    const result = await removeNewsletterFromMissionHub("nl_1", {
      clearNotifications: false,
      clearEmailDeliveries: false,
    });

    expect(prisma.communityNotificationRecord.deleteMany).not.toHaveBeenCalled();
    expect(prisma.missionHubEmailDeliveryRecord.deleteMany).not.toHaveBeenCalled();
    expect(result.notificationsDeleted).toBe(0);
    expect(result.emailDeliveriesDeleted).toBe(0);
  });
});

describe("getNewsletterMissionHubDiagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.communityPostRecord.findMany).mockResolvedValue([
      {
        id: "p1",
        spaceId: "s1",
        status: "published",
        publishedAt: new Date(),
        updatedAt: new Date(),
        space: { slug: "ministry-updates" },
      },
    ] as never);
    vi.mocked(prisma.communityNotificationRecord.count).mockResolvedValue(4);
    vi.mocked(prisma.missionHubEmailDeliveryRecord.findMany).mockResolvedValue([
      { status: "sent" },
      { status: "sent" },
      { status: "failed" },
    ] as never);
  });

  it("returns post, notification, and email delivery summary", async () => {
    const diagnostics = await getNewsletterMissionHubDiagnostics("nl_1");

    expect(diagnostics.newsletterId).toBe("nl_1");
    expect(diagnostics.posts).toHaveLength(1);
    expect(diagnostics.inAppNotificationCount).toBe(4);
    expect(diagnostics.emailDeliveryCount).toBe(3);
    expect(diagnostics.emailDeliveryByStatus).toEqual({ sent: 2, failed: 1 });
  });
});

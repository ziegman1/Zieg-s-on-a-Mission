import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    communityNotificationRecord: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  NEWSLETTER_PUBLISHED_NOTIFICATION_TITLE,
  newsletterPublishNotificationDedupeKey,
  upsertNewsletterPublishedNotification,
} from "./notifications";

describe("upsertNewsletterPublishedNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a deduped notification on first publish", async () => {
    vi.mocked(prisma.communityNotificationRecord.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.communityNotificationRecord.create).mockResolvedValue({ id: "n1" } as never);

    const outcome = await upsertNewsletterPublishedNotification({
      recipientUserId: "u1",
      newsletterId: "nl_1",
      newsletterSlug: "march",
      newsletterPath: "/newsletters/march",
      body: "Highlights",
      sourcePostId: "post-1",
      missionHubSpaceSlug: "newsletters",
      ministryUpdatesPostId: "post-ministry",
      ministryUpdatesSpaceSlug: "ministry-updates",
      newsletterSpacePostId: "post-1",
    });

    expect(outcome).toBe("created");
    expect(prisma.communityNotificationRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipientUserId: "u1",
        type: "newsletter_published",
        title: NEWSLETTER_PUBLISHED_NOTIFICATION_TITLE,
        body: "Highlights",
        postId: "post-1",
        dedupeKey: newsletterPublishNotificationDedupeKey("nl_1"),
        metadata: expect.objectContaining({
          sourceKind: "newsletter",
          sourceId: "nl_1",
          sourcePostId: "post-1",
        }),
      }),
    });
  });

  it("updates existing notification on republish instead of duplicating", async () => {
    vi.mocked(prisma.communityNotificationRecord.findFirst).mockResolvedValue({
      id: "n-existing",
    } as never);
    vi.mocked(prisma.communityNotificationRecord.update).mockResolvedValue({ id: "n-existing" } as never);

    const outcome = await upsertNewsletterPublishedNotification({
      recipientUserId: "u1",
      newsletterId: "nl_1",
      newsletterSlug: "march",
      newsletterPath: "/newsletters/march",
      body: "Updated excerpt",
      sourcePostId: "post-1",
      missionHubSpaceSlug: "newsletters",
      ministryUpdatesPostId: "post-ministry",
      ministryUpdatesSpaceSlug: "ministry-updates",
      newsletterSpacePostId: "post-1",
    });

    expect(outcome).toBe("updated");
    expect(prisma.communityNotificationRecord.create).not.toHaveBeenCalled();
    expect(prisma.communityNotificationRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "n-existing" },
        data: expect.objectContaining({
          body: "Updated excerpt",
          readAt: null,
        }),
      }),
    );
  });
});

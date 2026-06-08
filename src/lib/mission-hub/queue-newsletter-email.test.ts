import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NewsletterRecord } from "@/lib/newsletter/types";

vi.mock("@/lib/db", () => ({
  prisma: {
    missionHubEmailDeliveryRecord: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    emailSuppressionRecord: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("@/lib/mission-hub/resend-client", () => ({
  sendMissionHubEmail: vi.fn(),
}));

vi.mock("@/lib/mission-hub/site-url", () => ({
  absoluteMissionHubUrl: (path: string) => `https://example.com${path}`,
}));

import { prisma } from "@/lib/db";
import { sendMissionHubEmail } from "@/lib/mission-hub/resend-client";
import { queueAndSendNewsletterPublishEmail } from "./newsletter-publish-email";

const newsletter = {
  id: "nl_1",
  title: "Update",
  slug: "update",
  excerpt: "Excerpt",
  subtitle: "",
} as NewsletterRecord;

describe("queueAndSendNewsletterPublishEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.emailSuppressionRecord.findFirst).mockResolvedValue(null);
  });

  it("dedupes when delivery already sent", async () => {
    vi.mocked(prisma.missionHubEmailDeliveryRecord.findUnique).mockResolvedValue({
      id: "del-1",
      status: "sent",
    } as never);

    const result = await queueAndSendNewsletterPublishEmail({
      recipientUserId: "u1",
      recipientEmail: "a@example.com",
      newsletter,
      missionHubPostUrl: "https://example.com/community/newsletters#post-1",
    });

    expect(result.action).toBe("deduped");
    expect(sendMissionHubEmail).not.toHaveBeenCalled();
  });

  it("resends when forceResend is true", async () => {
    vi.mocked(prisma.missionHubEmailDeliveryRecord.findUnique).mockResolvedValue({
      id: "del-1",
      status: "sent",
    } as never);
    vi.mocked(prisma.missionHubEmailDeliveryRecord.update).mockResolvedValue({
      id: "del-1",
    } as never);
    vi.mocked(sendMissionHubEmail).mockResolvedValue({
      ok: true,
      resendMessageId: "msg_1",
    });
    vi.mocked(prisma.missionHubEmailDeliveryRecord.update).mockResolvedValue({
      id: "del-1",
    } as never);

    const result = await queueAndSendNewsletterPublishEmail({
      recipientUserId: "u1",
      recipientEmail: "a@example.com",
      newsletter,
      missionHubPostUrl: "https://example.com/community/newsletters#post-1",
      forceResend: true,
    });

    expect(result.action).toBe("sent");
    expect(sendMissionHubEmail).toHaveBeenCalled();
  });

  it("records failed send with error message", async () => {
    vi.mocked(prisma.missionHubEmailDeliveryRecord.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.missionHubEmailDeliveryRecord.create).mockResolvedValue({
      id: "del-new",
    } as never);
    vi.mocked(sendMissionHubEmail).mockResolvedValue({
      ok: false,
      error: "Invalid API key",
    });

    const result = await queueAndSendNewsletterPublishEmail({
      recipientUserId: "u1",
      recipientEmail: "a@example.com",
      newsletter,
      missionHubPostUrl: "https://example.com/community/newsletters#post-1",
    });

    expect(result).toEqual({
      action: "failed",
      deliveryId: "del-new",
      error: "Invalid API key",
    });
    expect(prisma.missionHubEmailDeliveryRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "del-new" },
        data: expect.objectContaining({
          status: "failed",
          errorMessage: "Invalid API key",
        }),
      }),
    );
  });
});

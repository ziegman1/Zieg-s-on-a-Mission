import { describe, expect, it, vi, beforeEach } from "vitest";

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

import { prisma } from "@/lib/db";
import { sendMissionHubEmail } from "@/lib/mission-hub/resend-client";
import { queueMissionHubEmailDelivery } from "./email-delivery-queue";

const basePayload = {
  recipientUserId: "u1",
  recipientEmail: "a@example.com",
  notificationKind: "post_published" as const,
  dedupeKey: "post:p1:email",
  subject: "New post in Prayer",
  html: "<p>Hi</p>",
  text: "Hi",
  metadata: {
    sourceKind: "post" as const,
    sourceId: "p1",
    sourcePostId: "p1",
  },
};

describe("queueMissionHubEmailDelivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TEST_MISSION_HUB_EMAIL_RECIPIENTS;
    vi.mocked(prisma.emailSuppressionRecord.findFirst).mockResolvedValue(null);
  });

  it("skips email in smoke test when no test recipients configured", async () => {
    const result = await queueMissionHubEmailDelivery(basePayload, { smokeTest: true });
    expect(result).toEqual({ action: "skipped", reason: "smoke_test_no_test_recipients" });
    expect(sendMissionHubEmail).not.toHaveBeenCalled();
  });

  it("sends only to allowlisted email in smoke test", async () => {
    process.env.TEST_MISSION_HUB_EMAIL_RECIPIENTS = "a@example.com";
    vi.mocked(prisma.missionHubEmailDeliveryRecord.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.missionHubEmailDeliveryRecord.create).mockResolvedValue({
      id: "del-1",
    } as never);
    vi.mocked(sendMissionHubEmail).mockResolvedValue({
      ok: true,
      resendMessageId: "msg_abc",
    });

    const allowed = await queueMissionHubEmailDelivery(basePayload, { smokeTest: true });
    expect(allowed.action).toBe("sent");

    const blocked = await queueMissionHubEmailDelivery(
      { ...basePayload, recipientEmail: "other@example.com" },
      { smokeTest: true },
    );
    expect(blocked).toEqual({
      action: "skipped",
      reason: "not_in_test_recipient_allowlist",
    });
  });

  it("records Resend failure on delivery row", async () => {
    vi.mocked(prisma.missionHubEmailDeliveryRecord.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.missionHubEmailDeliveryRecord.create).mockResolvedValue({
      id: "del-fail",
    } as never);
    vi.mocked(sendMissionHubEmail).mockResolvedValue({
      ok: false,
      error: "Invalid API key",
    });

    const result = await queueMissionHubEmailDelivery(basePayload);
    expect(result).toEqual({
      action: "failed",
      deliveryId: "del-fail",
      error: "Invalid API key",
    });
  });
});

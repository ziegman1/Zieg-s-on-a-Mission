import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/mission-hub/weekly-digest", () => ({
  prepareWeeklyMissionHubDigest: vi.fn(),
}));

vi.mock("@/lib/mission-hub/weekly-digest-recipients", () => ({
  listWeeklyDigestEmailRecipients: vi.fn(),
}));

vi.mock("@/lib/mission-hub/weekly-digest-email", () => ({
  getWeeklyDigestEmailDisabledReason: vi.fn(),
  queueAndSendWeeklyDigestEmail: vi.fn(),
}));

vi.mock("@/lib/mission-hub/email-config", () => ({
  isMissionHubEmailNotificationsEnabled: vi.fn(),
}));

vi.mock("@/lib/mission-hub/notification-preference-events", () => ({
  verifyEmailSuppressionsTableReady: vi.fn(),
}));

import { isMissionHubEmailNotificationsEnabled } from "@/lib/mission-hub/email-config";
import {
  getWeeklyDigestEmailDisabledReason,
  queueAndSendWeeklyDigestEmail,
} from "@/lib/mission-hub/weekly-digest-email";
import { deliverWeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest-delivery";
import { listWeeklyDigestEmailRecipients } from "@/lib/mission-hub/weekly-digest-recipients";
import { prepareWeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest";
import { verifyEmailSuppressionsTableReady } from "@/lib/mission-hub/notification-preference-events";
import type { WeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest-core";

const digestWithContent: WeeklyMissionHubDigest = {
  prepared: true,
  deliveryEnabled: false,
  dateRange: { start: "2026-06-03T12:00:00.000Z", end: "2026-06-10T12:00:00.000Z" },
  sections: [],
  totals: {
    prayerRequests: 1,
    praiseReports: 0,
    encouragementPosts: 0,
    ministryUpdates: 0,
    blogArticles: 0,
    resources: 0,
    newsletters: 0,
    comments: 0,
    voicePrayers: 0,
    reactions: 0,
    publishedPosts: 1,
  },
  hasContent: true,
  digestEmailRecipientsPrepared: 2,
};

const emptyDigest: WeeklyMissionHubDigest = {
  ...digestWithContent,
  hasContent: false,
  totals: { ...digestWithContent.totals, prayerRequests: 0, publishedPosts: 0 },
};

describe("deliverWeeklyMissionHubDigest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prepareWeeklyMissionHubDigest).mockResolvedValue(digestWithContent);
    vi.mocked(listWeeklyDigestEmailRecipients).mockResolvedValue([
      { userId: "u1", email: "one@example.com" },
      { userId: "u2", email: "two@example.com" },
    ]);
    vi.mocked(isMissionHubEmailNotificationsEnabled).mockReturnValue(true);
    vi.mocked(getWeeklyDigestEmailDisabledReason).mockReturnValue(null);
    vi.mocked(queueAndSendWeeklyDigestEmail).mockResolvedValue({ action: "sent", deliveryId: "d1", resendMessageId: "m1" });
    vi.mocked(verifyEmailSuppressionsTableReady).mockResolvedValue({
      ok: true,
      message: "email_suppressions table is available",
    });
  });

  it("aborts when email_suppressions table is missing", async () => {
    vi.mocked(verifyEmailSuppressionsTableReady).mockResolvedValue({
      ok: false,
      message: "email_suppressions table missing",
    });

    const result = await deliverWeeklyMissionHubDigest({ broadcastToMembers: true });

    expect(result.sent).toBe(0);
    expect(result.errors[0]).toContain("email_suppressions");
    expect(queueAndSendWeeklyDigestEmail).not.toHaveBeenCalled();
  });

  it("does not send when email feature is disabled", async () => {
    vi.mocked(isMissionHubEmailNotificationsEnabled).mockReturnValue(false);
    vi.mocked(getWeeklyDigestEmailDisabledReason).mockReturnValue(
      "Mission Hub email notifications are disabled (ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS).",
    );

    const result = await deliverWeeklyMissionHubDigest({ broadcastToMembers: true });

    expect(result.emailEnabled).toBe(false);
    expect(result.sent).toBe(0);
    expect(queueAndSendWeeklyDigestEmail).not.toHaveBeenCalled();
  });

  it("does not broadcast to members when digest has no content", async () => {
    vi.mocked(prepareWeeklyMissionHubDigest).mockResolvedValue(emptyDigest);

    const result = await deliverWeeklyMissionHubDigest({ broadcastToMembers: true });

    expect(result.sent).toBe(0);
    expect(result.errors[0]).toContain("no content");
    expect(queueAndSendWeeklyDigestEmail).not.toHaveBeenCalled();
  });

  it("dedupes prevent duplicate member sends", async () => {
    vi.mocked(queueAndSendWeeklyDigestEmail)
      .mockResolvedValueOnce({ action: "sent", deliveryId: "d1", resendMessageId: "m1" })
      .mockResolvedValueOnce({ action: "deduped", deliveryId: "d2" });

    const result = await deliverWeeklyMissionHubDigest({ broadcastToMembers: true });

    expect(result.sent).toBe(1);
    expect(result.deduped).toBe(1);
    expect(queueAndSendWeeklyDigestEmail).toHaveBeenCalledTimes(2);
    expect(queueAndSendWeeklyDigestEmail).toHaveBeenCalledWith(
      expect.objectContaining({ forceResend: false }),
    );
  });

  it("force resend passes through to queue helper", async () => {
    await deliverWeeklyMissionHubDigest({ broadcastToMembers: true, forceResend: true });

    expect(queueAndSendWeeklyDigestEmail).toHaveBeenCalledWith(
      expect.objectContaining({ forceResend: true }),
    );
  });

  it("allows test send even when digest has no content", async () => {
    vi.mocked(prepareWeeklyMissionHubDigest).mockResolvedValue(emptyDigest);

    const result = await deliverWeeklyMissionHubDigest({
      testRecipient: { userId: "admin", email: "admin@example.com" },
    });

    expect(result.sent).toBe(1);
    expect(queueAndSendWeeklyDigestEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        testSend: true,
        forceResend: true,
        recipientEmail: "admin@example.com",
      }),
    );
  });

  it("continues sending when one recipient fails", async () => {
    vi.mocked(queueAndSendWeeklyDigestEmail)
      .mockResolvedValueOnce({ action: "failed", deliveryId: "d1", error: "Rate limit" })
      .mockResolvedValueOnce({ action: "sent", deliveryId: "d2", resendMessageId: "m2" });

    const result = await deliverWeeklyMissionHubDigest({ broadcastToMembers: true });

    expect(result.failed).toBe(1);
    expect(result.sent).toBe(1);
    expect(result.errors).toContain("Rate limit");
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/community/settings-types";

vi.mock("@/lib/db", () => ({
  prisma: {
    communityMemberRecord: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/community/user-notification-prefs", () => ({
  getUserNotificationPreferences: vi.fn(),
}));

vi.mock("@/lib/community/notifications", () => ({
  buildUrgentPrayerPublishedNotificationBody: vi.fn(
    (title: string | null, excerpt: string | null, body: string) =>
      `${title ?? "Prayer"} — ${excerpt ?? body.slice(0, 40)}`,
  ),
  upsertUrgentPrayerRequestNotification: vi.fn(),
}));

vi.mock("@/lib/mission-hub/email-config", () => ({
  isMissionHubEmailNotificationsEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/mission-hub/newsletter-publish-email", () => ({
  getNewsletterPublishEmailDisabledReason: vi.fn(() => null),
}));

vi.mock("@/lib/mission-hub/urgent-prayer-email", () => ({
  queueAndSendUrgentPrayerEmail: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { upsertUrgentPrayerRequestNotification } from "@/lib/community/notifications";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { isMissionHubEmailNotificationsEnabled } from "@/lib/mission-hub/email-config";
import { queueAndSendUrgentPrayerEmail } from "@/lib/mission-hub/urgent-prayer-email";
import { deliverUrgentPrayerRequestNotifications } from "./deliver-urgent-prayer-notifications";

const urgentPost = {
  id: "post-urgent-1",
  spaceId: "space-prayer",
  title: "Please pray",
  body: "We need prayer for travel safety.",
  excerpt: null,
  authorUserId: "author-1",
  space: {
    id: "space-prayer",
    slug: "prayer-and-praise-room",
    title: "Prayer & Praise Room",
    status: "published",
  },
};

describe("deliverUrgentPrayerRequestNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isMissionHubEmailNotificationsEnabled).mockReturnValue(true);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue(DEFAULT_NOTIFICATION_PREFERENCES);
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "member@example.com" } },
      { userId: "author-1", user: { email: "author@example.com" } },
    ] as never);
    vi.mocked(upsertUrgentPrayerRequestNotification).mockResolvedValue("created");
    vi.mocked(queueAndSendUrgentPrayerEmail).mockResolvedValue({
      action: "sent",
      deliveryId: "d1",
      resendMessageId: "msg_1",
    });
  });

  it("sends urgent in-app notification and email to eligible members", async () => {
    const result = await deliverUrgentPrayerRequestNotifications(urgentPost, {
      authorUserId: "author-1",
    });

    expect(result.inAppNotificationsSent).toBe(1);
    expect(result.emailNotificationsSent).toBe(1);
    expect(upsertUrgentPrayerRequestNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserId: "u1", postId: "post-urgent-1" }),
    );
    expect(queueAndSendUrgentPrayerEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: "u1",
        postId: "post-urgent-1",
        forceResend: false,
      }),
    );
  });

  it("excludes post author", async () => {
    await deliverUrgentPrayerRequestNotifications(urgentPost, { authorUserId: "author-1" });
    expect(upsertUrgentPrayerRequestNotification).not.toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserId: "author-1" }),
    );
  });

  it("skips email when ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS is off", async () => {
    vi.mocked(isMissionHubEmailNotificationsEnabled).mockReturnValue(false);

    const result = await deliverUrgentPrayerRequestNotifications(urgentPost, {
      authorUserId: "author-1",
    });

    expect(result.inAppNotificationsSent).toBe(1);
    expect(result.emailNotificationsSent).toBe(0);
    expect(queueAndSendUrgentPrayerEmail).not.toHaveBeenCalled();
  });

  it("does not send to muted Prayer Room users", async () => {
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      mutedSpaceIds: ["space-prayer"],
    });

    const result = await deliverUrgentPrayerRequestNotifications(urgentPost, {
      authorUserId: "author-1",
    });

    expect(result.skippedMutedOrDisabled).toBe(1);
    expect(queueAndSendUrgentPrayerEmail).not.toHaveBeenCalled();
  });

  it("dedupes email on republish", async () => {
    vi.mocked(queueAndSendUrgentPrayerEmail).mockResolvedValue({ action: "deduped" });

    const result = await deliverUrgentPrayerRequestNotifications(urgentPost, {
      authorUserId: "author-1",
    });

    expect(result.emailNotificationsDeduped).toBe(1);
    expect(result.emailNotificationsSent).toBe(0);
  });
});

import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/community/settings-types";

vi.mock("@/lib/db", () => ({
  prisma: {
    communityPostRecord: { findFirst: vi.fn() },
    communityMemberRecord: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/community/user-notification-prefs", () => ({
  getUserNotificationPreferences: vi.fn(),
}));

vi.mock("@/lib/community/notifications", () => ({
  upsertNewPostPublishedNotification: vi.fn(),
}));

vi.mock("@/lib/mission-hub/newsletter-publish-email", () => ({
  getNewsletterPublishEmailDisabledReason: vi.fn(() => null),
}));

vi.mock("@/lib/mission-hub/email-config", () => ({
  isMissionHubEmailNotificationsEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/mission-hub/post-publish-email", () => ({
  queueAndSendPostPublishEmail: vi.fn(),
}));

vi.mock("@/lib/community/deliver-urgent-prayer-notifications", () => ({
  deliverUrgentPrayerRequestNotifications: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { deliverUrgentPrayerRequestNotifications } from "@/lib/community/deliver-urgent-prayer-notifications";
import { upsertNewPostPublishedNotification } from "@/lib/community/notifications";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { queueAndSendPostPublishEmail } from "@/lib/mission-hub/post-publish-email";
import { deliverPostPublishNotifications } from "./deliver-post-publish-notifications";

const publishedPost = {
  id: "post-1",
  spaceId: "space-1",
  title: "Hello",
  body: "Body text",
  excerpt: null,
  sourceKind: null,
  metadata: {},
  authorUserId: "author-1",
  space: {
    id: "space-1",
    slug: "prayer",
    title: "Prayer Room",
    status: "published",
    settings: { notificationCategory: "prayer_requests" },
  },
};

describe("deliverPostPublishNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
    });
    vi.mocked(prisma.communityPostRecord.findFirst).mockResolvedValue(publishedPost as never);
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "member@example.com" } },
      { userId: "author-1", user: { email: "author@example.com" } },
    ] as never);
    vi.mocked(upsertNewPostPublishedNotification).mockResolvedValue("created");
    vi.mocked(queueAndSendPostPublishEmail).mockResolvedValue({
      action: "sent",
      deliveryId: "d1",
      resendMessageId: "msg_1",
    });
  });

  it("skips newsletter announcement posts", async () => {
    vi.mocked(prisma.communityPostRecord.findFirst).mockResolvedValue({
      ...publishedPost,
      sourceKind: "newsletter",
    } as never);

    const result = await deliverPostPublishNotifications("post-1");
    expect(result?.skippedNewsletterAnnouncement).toBe(true);
    expect(upsertNewPostPublishedNotification).not.toHaveBeenCalled();
  });

  it("excludes post author from notifications", async () => {
    await deliverPostPublishNotifications("post-1");
    expect(upsertNewPostPublishedNotification).toHaveBeenCalledTimes(1);
    expect(upsertNewPostPublishedNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserId: "u1" }),
    );
  });

  it("excludes user when new posts disabled for custom-category spaces", async () => {
    vi.mocked(prisma.communityPostRecord.findFirst).mockResolvedValue({
      ...publishedPost,
      space: {
        ...publishedPost.space,
        settings: { notificationCategory: "custom" },
      },
    } as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      newPosts: false,
    });

    await deliverPostPublishNotifications("post-1");
    expect(upsertNewPostPublishedNotification).not.toHaveBeenCalled();
    expect(queueAndSendPostPublishEmail).not.toHaveBeenCalled();
  });

  it("excludes user when ministryUpdates off for ministry_updates space", async () => {
    vi.mocked(prisma.communityPostRecord.findFirst).mockResolvedValue({
      ...publishedPost,
      space: {
        ...publishedPost.space,
        settings: { notificationCategory: "ministry_updates" },
      },
    } as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      newPosts: true,
      ministryUpdates: false,
    });

    await deliverPostPublishNotifications("post-1");
    expect(upsertNewPostPublishedNotification).not.toHaveBeenCalled();
  });

  it("notifies when ministryUpdates on even if newPosts off for ministry_updates space", async () => {
    vi.mocked(prisma.communityPostRecord.findFirst).mockResolvedValue({
      ...publishedPost,
      space: {
        ...publishedPost.space,
        settings: { notificationCategory: "ministry_updates" },
      },
    } as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      newPosts: false,
      ministryUpdates: true,
    });

    await deliverPostPublishNotifications("post-1");
    expect(upsertNewPostPublishedNotification).toHaveBeenCalledTimes(1);
  });

  it("excludes user when prayerResponses disabled for prayer_requests space", async () => {
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      newPosts: true,
      prayerResponses: false,
    });

    await deliverPostPublishNotifications("post-1");
    expect(upsertNewPostPublishedNotification).not.toHaveBeenCalled();
    expect(queueAndSendPostPublishEmail).not.toHaveBeenCalled();
  });

  it("excludes user when email channel disabled", async () => {
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      email: false,
      inApp: false,
    });

    await deliverPostPublishNotifications("post-1");
    expect(queueAndSendPostPublishEmail).not.toHaveBeenCalled();
  });

  it("excludes user when space is muted", async () => {
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      mutedSpaceIds: ["space-1"],
    });

    await deliverPostPublishNotifications("post-1");
    expect(upsertNewPostPublishedNotification).not.toHaveBeenCalled();
  });

  it("uses specialized post email with dedupe", async () => {
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
    });

    await deliverPostPublishNotifications("post-1");
    expect(queueAndSendPostPublishEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: "post-1",
        recipientUserId: "u1",
        spaceName: "Prayer Room",
      }),
    );
  });

  it("routes urgent prayer posts to dedicated delivery instead of generic email", async () => {
    vi.mocked(prisma.communityPostRecord.findFirst).mockResolvedValue({
      ...publishedPost,
      metadata: { urgentPrayerRequest: true },
    } as never);
    vi.mocked(deliverUrgentPrayerRequestNotifications).mockResolvedValue({
      postId: "post-1",
      spaceId: "space-1",
      spaceSlug: "prayer",
      urgentPrayerRequest: true,
      totalMembersWithAccounts: 2,
      inAppNotificationsSent: 1,
      inAppNotificationsUpdated: 0,
      emailNotificationsSent: 1,
      emailNotificationsDeduped: 0,
      emailNotificationsFailed: 0,
      emailNotificationsSkipped: 0,
      emailSkippedNoAddress: 0,
      skippedMutedOrDisabled: 0,
      skippedRecipients: [],
      resendMessageIds: ["msg_urgent"],
    });

    const result = await deliverPostPublishNotifications("post-1");

    expect(deliverUrgentPrayerRequestNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ id: "post-1" }),
      {},
    );
    expect(upsertNewPostPublishedNotification).not.toHaveBeenCalled();
    expect(queueAndSendPostPublishEmail).not.toHaveBeenCalled();
    expect(result?.emailNotificationsSent).toBe(1);
  });
});

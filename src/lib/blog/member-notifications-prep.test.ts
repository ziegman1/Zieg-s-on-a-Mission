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
  buildBlogPublishedNotificationBody: vi.fn(
    (excerpt: string, body: string) => excerpt.trim() || body.trim().slice(0, 80) || "A new blog article is available.",
  ),
  upsertBlogPublishedNotification: vi.fn(),
}));

vi.mock("@/lib/mission-hub/email-config", () => ({
  isMissionHubEmailNotificationsEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/mission-hub/advanced-notifications-config", () => ({
  isMissionHubAdvancedNotificationsEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/mission-hub/blog-publish-email", () => ({
  getBlogPublishEmailDisabledReason: vi.fn(() => null),
  queueAndSendBlogPublishEmail: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { upsertBlogPublishedNotification } from "@/lib/community/notifications";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { isMissionHubEmailNotificationsEnabled } from "@/lib/mission-hub/email-config";
import { getBlogPublishEmailDisabledReason, queueAndSendBlogPublishEmail } from "@/lib/mission-hub/blog-publish-email";
import { deliverBlogPublishNotifications } from "./member-notifications-prep";
import type { BlogPostRecord } from "./types";

const sampleBlog: BlogPostRecord = {
  id: "blog_1",
  title: "Field Notes",
  slug: "field-notes",
  excerpt: "A quick update.",
  body: "Full body",
  featuredImageUrl: null,
  featuredImageAlt: "",
  status: "PUBLISHED",
  publishedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const deliveryOptions = {
  sourcePostId: "post-blog-1",
  missionHubSpaceSlug: "blog-articles",
  blogArticlesSpaceId: "space-blog",
};

describe("deliverBlogPublishNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isMissionHubEmailNotificationsEnabled).mockReturnValue(true);
    vi.mocked(getBlogPublishEmailDisabledReason).mockReturnValue(null);
    vi.mocked(upsertBlogPublishedNotification).mockResolvedValue("updated");
    vi.mocked(queueAndSendBlogPublishEmail).mockResolvedValue({ action: "deduped" });
  });

  it("creates in-app notifications for eligible members", async () => {
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue(DEFAULT_NOTIFICATION_PREFERENCES);
    vi.mocked(upsertBlogPublishedNotification).mockResolvedValueOnce("created");

    const result = await deliverBlogPublishNotifications(sampleBlog, deliveryOptions);

    expect(result.inAppNotificationsSent).toBe(1);
    expect(upsertBlogPublishedNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: "u1",
        blogPostId: "blog_1",
        sourcePostId: "post-blog-1",
      }),
    );
  });

  it("skips email queue when ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS is off", async () => {
    vi.mocked(isMissionHubEmailNotificationsEnabled).mockReturnValue(false);
    vi.mocked(getBlogPublishEmailDisabledReason).mockReturnValue(
      "Mission Hub email notifications are disabled (ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS).",
    );
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue(DEFAULT_NOTIFICATION_PREFERENCES);
    vi.mocked(upsertBlogPublishedNotification).mockResolvedValueOnce("created");

    const result = await deliverBlogPublishNotifications(sampleBlog, deliveryOptions);

    expect(result.emailEnabled).toBe(false);
    expect(result.inAppNotificationsSent).toBe(1);
    expect(result.emailNotificationsSent).toBe(0);
    expect(queueAndSendBlogPublishEmail).not.toHaveBeenCalled();
  });

  it("dedupes email on normal republish", async () => {
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue(DEFAULT_NOTIFICATION_PREFERENCES);

    const result = await deliverBlogPublishNotifications(sampleBlog, deliveryOptions);

    expect(result.emailNotificationsDeduped).toBe(1);
    expect(result.emailNotificationsSent).toBe(0);
    expect(queueAndSendBlogPublishEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        forceResend: false,
      }),
    );
  });

  it("resends email when force resend is requested", async () => {
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue(DEFAULT_NOTIFICATION_PREFERENCES);
    vi.mocked(queueAndSendBlogPublishEmail).mockResolvedValue({
      action: "sent",
      deliveryId: "del-1",
      resendMessageId: "msg-1",
    });

    const result = await deliverBlogPublishNotifications(sampleBlog, {
      ...deliveryOptions,
      resendBlogEmail: true,
    });

    expect(result.emailNotificationsSent).toBe(1);
    expect(queueAndSendBlogPublishEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        forceResend: true,
      }),
    );
  });
});

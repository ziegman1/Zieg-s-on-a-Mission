import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/community/settings-types";
import type { NewsletterRecord } from "./types";

vi.mock("@/lib/db", () => ({
  prisma: {
    communityMemberRecord: { findMany: vi.fn() },
    communitySpaceRecord: { findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/community/user-notification-prefs", () => ({
  getUserNotificationPreferences: vi.fn(),
}));

vi.mock("@/lib/community/notifications", () => ({
  buildNewsletterPublishedNotificationBody: vi.fn(() => "Body"),
  upsertNewsletterPublishedNotification: vi.fn(),
}));

vi.mock("@/lib/mission-hub/email-config", () => ({
  isMissionHubEmailNotificationsEnabled: vi.fn(() => true),
}));

vi.mock("@/lib/mission-hub/newsletter-publish-email", () => ({
  getNewsletterPublishEmailDisabledReason: vi.fn(() => null),
  queueAndSendNewsletterPublishEmail: vi.fn(),
}));

import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";

import { prisma } from "@/lib/db";
import { upsertNewsletterPublishedNotification } from "@/lib/community/notifications";
import { queueAndSendNewsletterPublishEmail } from "@/lib/mission-hub/newsletter-publish-email";
import { deliverNewsletterPublishNotifications } from "./member-notifications-prep";

const sampleNewsletter: NewsletterRecord = {
  id: "nl_1",
  title: "Test",
  subtitle: "",
  slug: "test",
  issueDate: null,
  headerImageUrl: null,
  useDefaultBrandedHeader: true,
  featuredImageUrl: null,
  excerpt: "Excerpt",
  body: "",
  bodyBlocks: [],
  ctaLabel: "",
  ctaUrl: "",
  ctaAlign: "center",
  footerImageUrl: null,
  footerAltText: "",
  useDefaultFooterImage: true,
  seoTitle: "",
  seoDescription: "",
  status: "PUBLISHED",
  publishedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const deliveryOptions = {
  sourcePostId: "post-n",
  missionHubSpaceSlug: "newsletters",
  ministryUpdatesPostId: "post-m",
  ministryUpdatesSpaceSlug: "ministry-updates",
  newsletterSpacePostId: "post-n",
  smokeTest: true,
};

describe("deliverNewsletterPublishNotifications smoke mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.TEST_MISSION_HUB_EMAIL_RECIPIENTS;
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
    });
    vi.mocked(prisma.communitySpaceRecord.findFirst).mockResolvedValue({
      id: "space-news",
    } as never);
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "allowed@example.com" } },
      { userId: "u2", user: { email: "blocked@example.com" } },
    ] as never);
    vi.mocked(upsertNewsletterPublishedNotification).mockResolvedValue("created");
    vi.mocked(queueAndSendNewsletterPublishEmail).mockResolvedValue({ action: "sent", deliveryId: "d1", resendMessageId: "msg_1" });
  });

  it("skips all emails in smoke test without allowlist", async () => {
    vi.mocked(queueAndSendNewsletterPublishEmail).mockResolvedValue({
      action: "skipped",
      reason: "smoke_test_no_test_recipients",
    });

    const result = await deliverNewsletterPublishNotifications(
      sampleNewsletter,
      deliveryOptions,
    );
    expect(queueAndSendNewsletterPublishEmail).toHaveBeenCalledTimes(2);
    expect(result.emailNotificationsSkipped).toBe(2);
    expect(result.emailNotificationsSent).toBe(0);
    expect(result.inAppNotificationsSent).toBe(2);
  });

  it("sends email only to test allowlist in smoke mode", async () => {
    process.env.TEST_MISSION_HUB_EMAIL_RECIPIENTS = "allowed@example.com";
    vi.mocked(queueAndSendNewsletterPublishEmail).mockImplementation(async (input) => {
      if (input.recipientEmail === "allowed@example.com") {
        return { action: "sent", deliveryId: "d1", resendMessageId: "msg_1" };
      }
      return { action: "skipped", reason: "not_in_test_recipient_allowlist" };
    });

    const result = await deliverNewsletterPublishNotifications(
      sampleNewsletter,
      deliveryOptions,
    );

    expect(queueAndSendNewsletterPublishEmail).toHaveBeenCalledTimes(2);
    expect(result.emailNotificationsSent).toBe(1);
    expect(result.emailNotificationsSkipped).toBe(1);
  });
});

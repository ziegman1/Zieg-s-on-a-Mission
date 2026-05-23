import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/community/settings-types";

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
  buildNewsletterPublishedNotificationBody: vi.fn(() => "Body text"),
  upsertNewsletterPublishedNotification: vi.fn(),
}));

vi.mock("@/lib/mission-hub/email-config", () => ({
  isMissionHubEmailNotificationsEnabled: vi.fn(),
}));

vi.mock("@/lib/mission-hub/newsletter-publish-email", () => ({
  getNewsletterPublishEmailDisabledReason: vi.fn(),
  queueAndSendNewsletterPublishEmail: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { upsertNewsletterPublishedNotification } from "@/lib/community/notifications";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { isMissionHubEmailNotificationsEnabled } from "@/lib/mission-hub/email-config";
import {
  getNewsletterPublishEmailDisabledReason,
  queueAndSendNewsletterPublishEmail,
} from "@/lib/mission-hub/newsletter-publish-email";
import { deliverNewsletterPublishNotifications } from "./member-notifications-prep";
import type { NewsletterRecord } from "./types";

const sampleNewsletter: NewsletterRecord = {
  id: "nl_1",
  title: "March Update",
  subtitle: "",
  slug: "march-update",
  issueDate: null,
  headerImageUrl: null,
  useDefaultBrandedHeader: true,
  featuredImageUrl: null,
  excerpt: "Highlights.",
  body: "Body",
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
  sourcePostId: "post-1",
  missionHubSpaceSlug: "newsletters",
};

describe("deliverNewsletterPublishNotifications — email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.communitySpaceRecord.findFirst).mockResolvedValue({
      id: "space-newsletters",
    } as never);
    vi.mocked(upsertNewsletterPublishedNotification).mockResolvedValue("created");
    vi.mocked(isMissionHubEmailNotificationsEnabled).mockReturnValue(false);
    vi.mocked(getNewsletterPublishEmailDisabledReason).mockReturnValue(
      "Mission Hub email notifications are disabled (ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS).",
    );
  });

  it("sends no emails when feature flag is off", async () => {
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "member@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue(
      DEFAULT_NOTIFICATION_PREFERENCES,
    );

    const result = await deliverNewsletterPublishNotifications(sampleNewsletter, {
      ...deliveryOptions,
      publisherUserId: "pub-1",
    });

    expect(result.emailNotificationsSent).toBe(0);
    expect(result.emailEnabled).toBe(false);
    expect(result.emailDisabledReason).toContain("disabled");
    expect(queueAndSendNewsletterPublishEmail).not.toHaveBeenCalled();
  });

  it("sends email to eligible members when enabled", async () => {
    vi.mocked(isMissionHubEmailNotificationsEnabled).mockReturnValue(true);
    vi.mocked(getNewsletterPublishEmailDisabledReason).mockReturnValue(null);
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
      { userId: "u2", user: { email: "b@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences)
      .mockResolvedValueOnce(DEFAULT_NOTIFICATION_PREFERENCES)
      .mockResolvedValueOnce({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        email: false,
      });
    vi.mocked(queueAndSendNewsletterPublishEmail).mockResolvedValue({ action: "sent", deliveryId: "d1" });

    const result = await deliverNewsletterPublishNotifications(sampleNewsletter, deliveryOptions);

    expect(result.emailNotificationsSent).toBe(1);
    expect(queueAndSendNewsletterPublishEmail).toHaveBeenCalledTimes(1);
    expect(queueAndSendNewsletterPublishEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: "u1",
        recipientEmail: "a@example.com",
        newsletter: sampleNewsletter,
      }),
    );
  });

  it("respects newsletter and email channel preferences", async () => {
    vi.mocked(isMissionHubEmailNotificationsEnabled).mockReturnValue(true);
    vi.mocked(getNewsletterPublishEmailDisabledReason).mockReturnValue(null);
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      newsletters: false,
    });

    const result = await deliverNewsletterPublishNotifications(sampleNewsletter, deliveryOptions);

    expect(result.emailNotificationsSent).toBe(0);
    expect(queueAndSendNewsletterPublishEmail).not.toHaveBeenCalled();
  });

  it("excludes members who muted the Newsletter space", async () => {
    vi.mocked(isMissionHubEmailNotificationsEnabled).mockReturnValue(true);
    vi.mocked(getNewsletterPublishEmailDisabledReason).mockReturnValue(null);
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      mutedSpaceIds: ["space-newsletters"],
    });

    const result = await deliverNewsletterPublishNotifications(sampleNewsletter, deliveryOptions);

    expect(result.emailNotificationsSent).toBe(0);
    expect(queueAndSendNewsletterPublishEmail).not.toHaveBeenCalled();
  });

  it("excludes the publisher from email", async () => {
    vi.mocked(isMissionHubEmailNotificationsEnabled).mockReturnValue(true);
    vi.mocked(getNewsletterPublishEmailDisabledReason).mockReturnValue(null);
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "pub-1", user: { email: "publisher@example.com" } },
      { userId: "u2", user: { email: "member@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue(
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
    vi.mocked(queueAndSendNewsletterPublishEmail).mockResolvedValue({ action: "sent", deliveryId: "d1" });

    const result = await deliverNewsletterPublishNotifications(sampleNewsletter, {
      ...deliveryOptions,
      publisherUserId: "pub-1",
    });

    expect(result.emailNotificationsSent).toBe(1);
    expect(queueAndSendNewsletterPublishEmail).toHaveBeenCalledWith(
      expect.objectContaining({ recipientUserId: "u2" }),
    );
  });

  it("dedupes email on republish", async () => {
    vi.mocked(isMissionHubEmailNotificationsEnabled).mockReturnValue(true);
    vi.mocked(getNewsletterPublishEmailDisabledReason).mockReturnValue(null);
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue(
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
    vi.mocked(queueAndSendNewsletterPublishEmail).mockResolvedValue({ action: "deduped" });

    const result = await deliverNewsletterPublishNotifications(sampleNewsletter, deliveryOptions);

    expect(result.emailNotificationsSent).toBe(0);
    expect(result.emailNotificationsDeduped).toBe(1);
  });

  it("counts Resend failures", async () => {
    vi.mocked(isMissionHubEmailNotificationsEnabled).mockReturnValue(true);
    vi.mocked(getNewsletterPublishEmailDisabledReason).mockReturnValue(null);
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue(
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
    vi.mocked(queueAndSendNewsletterPublishEmail).mockResolvedValue({
      action: "failed",
      deliveryId: "d1",
      error: "Resend API error",
    });

    const result = await deliverNewsletterPublishNotifications(sampleNewsletter, deliveryOptions);

    expect(result.emailNotificationsFailed).toBe(1);
    expect(result.emailNotificationsSent).toBe(0);
  });
});

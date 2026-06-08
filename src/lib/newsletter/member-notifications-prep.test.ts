import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
} from "@/lib/community/settings-types";

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
  buildNewsletterPublishedNotificationBody: vi.fn(
    (excerpt: string, subtitle: string) => excerpt.trim() || subtitle.trim() || "A new ministry update is available.",
  ),
  upsertNewsletterPublishedNotification: vi.fn(),
}));

vi.mock("@/lib/mission-hub/email-config", () => ({
  isMissionHubEmailNotificationsEnabled: vi.fn(() => false),
}));

vi.mock("@/lib/mission-hub/newsletter-publish-email", () => ({
  getNewsletterPublishEmailDisabledReason: vi.fn(() => "disabled"),
  queueAndSendNewsletterPublishEmail: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { upsertNewsletterPublishedNotification } from "@/lib/community/notifications";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { deliverNewsletterPublishNotifications } from "./member-notifications-prep";
import type { NewsletterRecord } from "./types";

const sampleNewsletter: NewsletterRecord = {
  id: "nl_1",
  title: "March Update",
  subtitle: "From the field",
  slug: "march-update",
  issueDate: null,
  headerImageUrl: null,
  useDefaultBrandedHeader: true,
  featuredImageUrl: null,
  excerpt: "Highlights from March.",
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
  sourcePostId: "post-newsletter-1",
  missionHubSpaceSlug: "newsletters",
  ministryUpdatesPostId: "post-ministry-1",
  ministryUpdatesSpaceSlug: "ministry-updates",
  newsletterSpacePostId: "post-newsletter-1",
};

describe("deliverNewsletterPublishNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.communitySpaceRecord.findFirst).mockResolvedValue({
      id: "space-newsletters",
    } as never);
    vi.mocked(upsertNewsletterPublishedNotification).mockResolvedValue("created");
  });

  it("creates in-app notifications for eligible members", async () => {
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
      { userId: "u2", user: { email: "b@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences)
      .mockResolvedValueOnce(DEFAULT_NOTIFICATION_PREFERENCES)
      .mockResolvedValueOnce(mergeNotificationPreferences({ newsletters: false }));

    const result = await deliverNewsletterPublishNotifications(sampleNewsletter, deliveryOptions);

    expect(result.inAppNotificationsSent).toBe(1);
    expect(result.inAppNotificationsUpdated).toBe(0);
    expect(upsertNewsletterPublishedNotification).toHaveBeenCalledTimes(1);
    expect(upsertNewsletterPublishedNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: "u1",
        newsletterId: "nl_1",
        sourcePostId: "post-newsletter-1",
        body: "Highlights from March.",
      }),
    );
  });

  it("excludes users with newsletters disabled", async () => {
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue(
      mergeNotificationPreferences({ newsletters: false }),
    );

    const result = await deliverNewsletterPublishNotifications(sampleNewsletter, deliveryOptions);

    expect(result.inAppNotificationsSent).toBe(0);
    expect(upsertNewsletterPublishedNotification).not.toHaveBeenCalled();
  });

  it("excludes users with in-app channel disabled", async () => {
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      inApp: false,
    });

    const result = await deliverNewsletterPublishNotifications(sampleNewsletter, deliveryOptions);

    expect(result.inAppNotificationsSent).toBe(0);
    expect(upsertNewsletterPublishedNotification).not.toHaveBeenCalled();
  });

  it("excludes users who muted the Newsletter space", async () => {
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      mutedSpaceIds: ["space-newsletters"],
    });

    const result = await deliverNewsletterPublishNotifications(sampleNewsletter, deliveryOptions);

    expect(result.inAppNotificationsSent).toBe(0);
    expect(upsertNewsletterPublishedNotification).not.toHaveBeenCalled();
  });

  it("counts republish as update without duplicating sent count", async () => {
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1", user: { email: "a@example.com" } },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue(DEFAULT_NOTIFICATION_PREFERENCES);
    vi.mocked(upsertNewsletterPublishedNotification).mockResolvedValue("updated");

    const result = await deliverNewsletterPublishNotifications(sampleNewsletter, deliveryOptions);

    expect(result.inAppNotificationsSent).toBe(0);
    expect(result.inAppNotificationsUpdated).toBe(1);
  });
});

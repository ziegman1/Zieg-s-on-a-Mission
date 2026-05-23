import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NewsletterRecord } from "./types";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("./member-notifications-prep", () => ({
  deliverNewsletterPublishNotifications: vi.fn(),
  formatMissionHubNotificationDeliveryLines: vi.fn(() => [
    "Mission Hub in-app notifications sent: 2.",
    "Mission Hub email notifications are disabled.",
  ]),
}));

vi.mock("./mission-hub-announcement", () => ({
  upsertMissionHubNewsletterAnnouncements: vi.fn(),
}));

vi.mock("./mission-hub-lifecycle", () => ({
  logNewsletterPublishFanOut: vi.fn(),
}));

import { deliverNewsletterPublishNotifications } from "./member-notifications-prep";
import { upsertMissionHubNewsletterAnnouncements } from "./mission-hub-announcement";
import { notifyMissionHubMembersOfNewsletterPublish } from "./notify";

const sample: NewsletterRecord = {
  id: "nl_1",
  title: "March Update",
  subtitle: "",
  slug: "march-update",
  issueDate: null,
  headerImageUrl: null,
  useDefaultBrandedHeader: true,
  featuredImageUrl: null,
  excerpt: "",
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

describe("notifyMissionHubMembersOfNewsletterPublish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(upsertMissionHubNewsletterAnnouncements).mockResolvedValue({
      ministryUpdates: {
        postId: "post-ministry",
        spaceSlug: "ministry-updates",
        spaceId: "space-1",
        created: true,
        newsletterPath: "/newsletters/march-update",
        targetSpaceType: "ministry_updates",
      },
      newsletterSpace: {
        postId: "post-newsletter",
        spaceSlug: "newsletters",
        spaceId: "space-2",
        created: true,
        newsletterPath: "/newsletters/march-update",
        targetSpaceType: "newsletter",
      },
    });
    vi.mocked(deliverNewsletterPublishNotifications).mockResolvedValue({
      inAppDelivered: true,
      emailEnabled: false,
      emailDisabledReason: "disabled",
      totalMembersWithAccounts: 2,
      inAppNotificationsSent: 2,
      inAppNotificationsUpdated: 0,
      emailNotificationsSent: 0,
      emailNotificationsDeduped: 0,
      emailNotificationsFailed: 0,
      emailSkippedNoAddress: 0,
      emailRecipientsPrepared: 1,
      inAppRecipientsPrepared: 2,
      pushRecipientsPrepared: 0,
      skippedMutedOrDisabled: 0,
    });
  });

  it("creates posts then sends in-app notifications using Newsletter space post", async () => {
    const result = await notifyMissionHubMembersOfNewsletterPublish(sample, {
      publisherUserId: "admin-1",
    });

    expect(result.ok).toBe(true);
    expect(upsertMissionHubNewsletterAnnouncements).toHaveBeenCalledWith(sample, "admin-1");
    expect(deliverNewsletterPublishNotifications).toHaveBeenCalledWith(sample, {
      sourcePostId: "post-newsletter",
      missionHubSpaceSlug: "newsletters",
      ministryUpdatesPostId: "post-ministry",
      ministryUpdatesSpaceSlug: "ministry-updates",
      newsletterSpacePostId: "post-newsletter",
      publisherUserId: "admin-1",
      resendNewsletterEmail: undefined,
    });
    expect(result.message).toContain("Mission Hub in-app notifications sent: 2");
    expect(result.notifications.emailNotificationsSent).toBe(0);
  });
});

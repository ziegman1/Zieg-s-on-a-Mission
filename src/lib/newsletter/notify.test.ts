import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NewsletterRecord } from "./types";

vi.mock("@/lib/newsletter/mission-hub-announcement", () => ({
  upsertMissionHubNewsletterAnnouncement: vi.fn(),
}));

vi.mock("@/lib/newsletter/member-notifications-prep", () => ({
  prepareNewsletterMemberNotifications: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { upsertMissionHubNewsletterAnnouncement } from "./mission-hub-announcement";
import { prepareNewsletterMemberNotifications } from "./member-notifications-prep";
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
  excerpt: "Preview",
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
  publishedAt: "2026-03-15T12:00:00.000Z",
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-15T12:00:00.000Z",
};

describe("notifyMissionHubMembersOfNewsletterPublish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(upsertMissionHubNewsletterAnnouncement).mockResolvedValue({
      postId: "post-1",
      spaceSlug: "ministry-updates",
      created: true,
      newsletterPath: "/newsletters/march-update",
    });
    vi.mocked(prepareNewsletterMemberNotifications).mockResolvedValue({
      prepared: true,
      deliveryEnabled: false,
      totalMembersWithAccounts: 2,
      emailRecipientsPrepared: 1,
      inAppRecipientsPrepared: 2,
      pushRecipientsPrepared: 0,
      skippedMutedOrDisabled: 1,
    });
  });

  it("creates Mission Hub announcement and prepares notification channels", async () => {
    const result = await notifyMissionHubMembersOfNewsletterPublish(sample, {
      publisherUserId: "admin-1",
    });

    expect(result.ok).toBe(true);
    expect(result.announcement.newsletterPath).toBe("/newsletters/march-update");
    expect(result.announcementCreated).toBe(true);
    expect(result.notifications.prepared).toBe(true);
    expect(result.notifications.deliveryEnabled).toBe(false);
    expect(result.notifications.emailRecipientsPrepared).toBe(1);
    expect(upsertMissionHubNewsletterAnnouncement).toHaveBeenCalledWith(sample, "admin-1");
  });
});

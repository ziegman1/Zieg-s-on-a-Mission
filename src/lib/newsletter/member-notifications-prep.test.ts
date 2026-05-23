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

import { prisma } from "@/lib/db";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { prepareNewsletterMemberNotifications } from "./member-notifications-prep";
import type { NewsletterRecord } from "./types";

const sampleNewsletter: NewsletterRecord = {
  id: "nl_1",
  title: "Test",
  subtitle: "",
  slug: "test",
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

describe("prepareNewsletterMemberNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.communitySpaceRecord.findFirst).mockResolvedValue({
      id: "space-ministry",
    } as never);
  });

  it("returns structured counts with delivery disabled", async () => {
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1" },
      { userId: "u2" },
    ] as never);
    vi.mocked(getUserNotificationPreferences)
      .mockResolvedValueOnce(DEFAULT_NOTIFICATION_PREFERENCES)
      .mockResolvedValueOnce({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        newsletters: false,
      });

    const result = await prepareNewsletterMemberNotifications(sampleNewsletter);

    expect(result.deliveryEnabled).toBe(false);
    expect(result.totalMembersWithAccounts).toBe(2);
    expect(result.emailRecipientsPrepared).toBe(1);
    expect(result.inAppRecipientsPrepared).toBe(1);
    expect(result.skippedMutedOrDisabled).toBe(1);
  });

  it("excludes email only when email channel is off", async () => {
    vi.mocked(prisma.communityMemberRecord.findMany).mockResolvedValue([
      { userId: "u1" },
    ] as never);
    vi.mocked(getUserNotificationPreferences).mockResolvedValue({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      email: false,
    });

    const result = await prepareNewsletterMemberNotifications(sampleNewsletter);
    expect(result.emailRecipientsPrepared).toBe(0);
    expect(result.inAppRecipientsPrepared).toBe(1);
  });
});

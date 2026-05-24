import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  isNewsletterPubliclyVisible,
  validateNewsletterInput,
} from "./newsletter-db";
import { mergeAdminNewsletters } from "./merge-newsletters";
import type { NewsletterInput, NewsletterRecord } from "./types";

vi.mock("@/lib/admin-auth", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/newsletter/newsletter-db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./newsletter-db")>();
  return {
    ...actual,
    saveNewsletter: vi.fn(),
    getNewsletterById: vi.fn(),
    listNewslettersForAdmin: vi.fn(),
    getNewsletterBySlugAnyStatus: vi.fn(),
  };
});

vi.mock("@/lib/newsletter/notify", () => ({
  notifyMissionHubMembersOfNewsletterPublish: vi.fn(),
}));

const mockNotifyResult: import("@/lib/newsletter/notify").NewsletterNotifyResult = {
  ok: true,
  newsletterId: "nl_1",
  ministryUpdates: {
    postId: "post-1",
    spaceSlug: "ministry-updates",
    spaceId: "space-1",
    created: true,
    newsletterPath: "/newsletters/march-update",
    targetSpaceType: "ministry_updates",
  },
  newsletterSpace: {
    postId: "post-2",
    spaceSlug: "newsletters",
    spaceId: "space-2",
    created: true,
    newsletterPath: "/newsletters/march-update",
    targetSpaceType: "newsletter",
  },
  announcement: {
    postId: "post-1",
    spaceSlug: "ministry-updates",
    spaceId: "space-1",
    created: true,
    newsletterPath: "/newsletters/march-update",
    targetSpaceType: "ministry_updates",
  },
  ministryUpdatesCreated: true,
  newsletterSpaceCreated: true,
  announcementCreated: true,
  notifications: {
    inAppDelivered: true,
    emailEnabled: false,
    emailDisabledReason: null,
    totalMembersWithAccounts: 0,
    inAppNotificationsSent: 0,
    inAppNotificationsUpdated: 0,
    emailNotificationsSent: 0,
    emailNotificationsDeduped: 0,
    emailNotificationsFailed: 0,
    emailNotificationsSkipped: 0,
    emailSkippedNoAddress: 0,
    emailRecipientsPrepared: 0,
    inAppRecipientsPrepared: 0,
    pushRecipientsPrepared: 0,
    skippedMutedOrDisabled: 0,
    skippedRecipients: [],
    resendMessageIds: [],
  },
  message: "Mission Hub announcement created.",
};

vi.mock("@/lib/newsletter/revalidate", () => ({
  revalidateNewsletterPaths: vi.fn(),
}));

import { requireAdminSession } from "@/lib/admin-auth";
import * as newsletterDb from "@/lib/newsletter/newsletter-db";
import { notifyMissionHubMembersOfNewsletterPublish as notifyMock } from "@/lib/newsletter/notify";
import {
  createNewsletterDraftAction,
  listAdminNewsletters,
  publishNewsletterAction,
} from "@/app/admin/site-builder/newsletter-actions";
import type { NewsletterNotifyResult } from "@/lib/newsletter/notify";

const sampleRecord: NewsletterRecord = {
  id: "nl_1",
  title: "March Update",
  subtitle: "From the field",
  slug: "march-update",
  issueDate: "2026-03-01T00:00:00.000Z",
  headerImageUrl: null,
  useDefaultBrandedHeader: true,
  featuredImageUrl: null,
  excerpt: "Preview text",
  body: "Hello members.",
  bodyBlocks: [],
  ctaLabel: "Give",
  ctaUrl: "https://example.com/give",
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

const baseInput: NewsletterInput = {
  title: "March Update",
  subtitle: "",
  slug: "march-update",
  issueDate: null,
  headerImageUrl: null,
  useDefaultBrandedHeader: true,
  featuredImageUrl: null,
  excerpt: "",
  body: "Hello members.",
  bodyBlocks: [],
  ctaLabel: "",
  ctaUrl: "",
  ctaAlign: "center",
  footerImageUrl: null,
  footerAltText: "",
  useDefaultFooterImage: true,
  seoTitle: "",
  seoDescription: "",
  status: "DRAFT",
  publishedAt: null,
};

describe("newsletter visibility", () => {
  it("only published newsletters are publicly visible", () => {
    expect(isNewsletterPubliclyVisible("PUBLISHED")).toBe(true);
    expect(isNewsletterPubliclyVisible("DRAFT")).toBe(false);
    expect(isNewsletterPubliclyVisible("ARCHIVED")).toBe(false);
  });
});

describe("validateNewsletterInput", () => {
  it("requires title for drafts", () => {
    expect(() => validateNewsletterInput({ ...baseInput, title: "  " }, "draft")).toThrow(
      /title/i,
    );
  });

  it("requires content before publish", () => {
    expect(() =>
      validateNewsletterInput(
        { ...baseInput, body: "", bodyBlocks: [], status: "PUBLISHED" },
        "publish",
      ),
    ).toThrow(/content block/i);
  });

  it("allows publish with bodyBlocks when legacy body is empty", () => {
    const block = {
      id: "blk_1",
      type: "text" as const,
      content: "Block paragraph.",
    };
    expect(() =>
      validateNewsletterInput(
        { ...baseInput, body: "", bodyBlocks: [block], status: "PUBLISHED" },
        "publish",
      ),
    ).not.toThrow();
  });
});

describe("mergeAdminNewsletters", () => {
  it("keeps saved newsletter when server list is empty", () => {
    const merged = mergeAdminNewsletters([], sampleRecord);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("nl_1");
  });
});

describe("newsletter admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated list", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue(null);
    const res = await listAdminNewsletters();
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe("Unauthorized");
  });

  it("creates draft when admin session is valid", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({ id: "admin", role: "ADMIN" });
    vi.mocked(newsletterDb.saveNewsletter).mockResolvedValue({
      ...sampleRecord,
      status: "DRAFT",
      publishedAt: null,
    });

    const res = await createNewsletterDraftAction({
      title: "March Update",
      subtitle: "",
      slug: "march-update",
      issueDate: null,
      headerImageUrl: null,
      useDefaultBrandedHeader: true,
      featuredImageUrl: null,
      excerpt: "",
      body: "Hello members.",
      bodyBlocks: [],
      ctaLabel: "",
      ctaUrl: "",
      ctaAlign: "center",
      footerImageUrl: null,
      footerAltText: "",
      useDefaultFooterImage: true,
      seoTitle: "",
      seoDescription: "",
      status: "DRAFT",
      publishedAt: null,
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.newsletter.status).toBe("DRAFT");
      expect(vi.mocked(notifyMock)).not.toHaveBeenCalled();
    }
  });

  it("publish calls notifyMissionHubMembersOfNewsletterPublish", async () => {
    vi.mocked(requireAdminSession).mockResolvedValue({ id: "admin", role: "ADMIN" });
    vi.mocked(newsletterDb.saveNewsletter).mockResolvedValue(sampleRecord);
    vi.mocked(notifyMock).mockResolvedValue(mockNotifyResult);

    const res = await publishNewsletterAction({
      title: "March Update",
      subtitle: "",
      slug: "march-update",
      issueDate: null,
      headerImageUrl: null,
      useDefaultBrandedHeader: true,
      featuredImageUrl: null,
      excerpt: "",
      body: "Hello members.",
      bodyBlocks: [],
      ctaLabel: "",
      ctaUrl: "",
      ctaAlign: "center",
      footerImageUrl: null,
      footerAltText: "",
      useDefaultFooterImage: true,
      seoTitle: "",
      seoDescription: "",
      status: "DRAFT",
      publishedAt: null,
    });

    expect(res.ok).toBe(true);
    expect(vi.mocked(notifyMock)).toHaveBeenCalledTimes(1);
    expect(vi.mocked(notifyMock)).toHaveBeenCalledWith(
      expect.objectContaining({ id: "nl_1", status: "PUBLISHED" }),
      { publisherUserId: "admin" },
    );
  });
});

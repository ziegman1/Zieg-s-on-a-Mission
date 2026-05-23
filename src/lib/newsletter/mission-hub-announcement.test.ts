import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NewsletterRecord } from "./types";

vi.mock("@/lib/db", () => ({
  prisma: {
    communitySpaceRecord: { findFirst: vi.fn() },
    communityPostRecord: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import {
  NEWSLETTER_SOURCE_KIND,
  archiveMissionHubNewsletterAnnouncement,
  buildNewsletterAnnouncementBody,
  buildNewsletterAnnouncementMetadata,
  newsletterPublicPath,
  parseNewsletterAnnouncementMetadata,
  upsertMissionHubNewsletterAnnouncement,
} from "./mission-hub-announcement";

const sample: NewsletterRecord = {
  id: "nl_test_1",
  title: "March Field Update",
  subtitle: "Notes from the journey",
  slug: "march-field-update",
  issueDate: "2026-03-01T00:00:00.000Z",
  headerImageUrl: null,
  useDefaultBrandedHeader: true,
  featuredImageUrl: "https://cdn.example.com/cover.jpg",
  excerpt: "Highlights from March.",
  body: "Full newsletter body stays on the public page.",
  bodyBlocks: [],
  ctaLabel: "Partner with us",
  ctaUrl: "https://example.com/partner",
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

describe("newsletter announcement builders", () => {
  it("builds metadata with public newsletter path", () => {
    const meta = buildNewsletterAnnouncementMetadata(sample);
    expect(meta.newsletterId).toBe("nl_test_1");
    expect(meta.newsletterSlug).toBe("march-field-update");
    expect(meta.newsletterPath).toBe("/newsletters/march-field-update");
    expect(meta.ctaLabel).toBe("Partner with us");
  });

  it("builds teaser body linking to public newsletter (not full body)", () => {
    const body = buildNewsletterAnnouncementBody(sample);
    expect(body).toContain("/newsletters/march-field-update");
    expect(body).toContain("Highlights from March.");
    expect(body).toContain("Partner with us");
    expect(body).not.toContain("Full newsletter body stays on the public page.");
  });

  it("does not include block composer content in Mission Hub teaser", () => {
    const withBlocks = {
      ...sample,
      bodyBlocks: [
        {
          id: "blk_secret",
          type: "text" as const,
          content: "Secret block-only paragraph that must not appear in Mission Hub.",
        },
      ],
    };
    const body = buildNewsletterAnnouncementBody(withBlocks);
    expect(body).not.toContain("Secret block-only paragraph");
    expect(body).toContain("Highlights from March.");
  });

  it("parses announcement metadata for feed cards", () => {
    const meta = buildNewsletterAnnouncementMetadata(sample);
    const link = parseNewsletterAnnouncementMetadata(meta, NEWSLETTER_SOURCE_KIND);
    expect(link?.newsletterPath).toBe(newsletterPublicPath("march-field-update"));
  });

  it("does not parse draft sources without newsletter kind", () => {
    expect(parseNewsletterAnnouncementMetadata({}, null)).toBeNull();
    expect(parseNewsletterAnnouncementMetadata({}, "manual")).toBeNull();
  });
});

describe("upsertMissionHubNewsletterAnnouncement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Mission Hub announcement on first publish", async () => {
    vi.mocked(prisma.communitySpaceRecord.findFirst).mockResolvedValue({
      id: "space-1",
      slug: "ministry-updates",
    } as never);
    vi.mocked(prisma.communityPostRecord.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.communityPostRecord.create).mockResolvedValue({ id: "post-1" } as never);

    const result = await upsertMissionHubNewsletterAnnouncement(sample, "admin-1");

    expect(result.created).toBe(true);
    expect(result.postId).toBe("post-1");
    expect(result.newsletterPath).toBe("/newsletters/march-field-update");
    expect(prisma.communityPostRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceKind: NEWSLETTER_SOURCE_KIND,
          sourceId: "nl_test_1",
          postType: "newsletter",
          status: "published",
        }),
      }),
    );
  });

  it("updates existing announcement on republish without creating duplicate", async () => {
    vi.mocked(prisma.communitySpaceRecord.findFirst).mockResolvedValue({
      id: "space-1",
      slug: "ministry-updates",
    } as never);
    vi.mocked(prisma.communityPostRecord.findUnique).mockResolvedValue({ id: "post-1" } as never);
    vi.mocked(prisma.communityPostRecord.update).mockResolvedValue({ id: "post-1" } as never);

    const result = await upsertMissionHubNewsletterAnnouncement(sample, "admin-1");

    expect(result.created).toBe(false);
    expect(prisma.communityPostRecord.create).not.toHaveBeenCalled();
    expect(prisma.communityPostRecord.update).toHaveBeenCalled();
  });
});

describe("archiveMissionHubNewsletterAnnouncement", () => {
  it("archives hub post when newsletter is unpublished", async () => {
    vi.mocked(prisma.communityPostRecord.updateMany).mockResolvedValue({ count: 1 });

    const archived = await archiveMissionHubNewsletterAnnouncement("nl_test_1");
    expect(archived).toBe(true);
    expect(prisma.communityPostRecord.updateMany).toHaveBeenCalledWith({
      where: {
        sourceKind: NEWSLETTER_SOURCE_KIND,
        sourceId: "nl_test_1",
        status: "published",
      },
      data: { status: "archived" },
    });
  });
});

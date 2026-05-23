import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NewsletterRecord } from "./types";

vi.mock("@/lib/db", () => ({
  prisma: {
    communitySpaceRecord: { findFirst: vi.fn() },
    communityPostRecord: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import {
  NEWSLETTER_SOURCE_KIND,
  NEWSLETTER_SPACE_SLUG,
  archiveMissionHubNewsletterAnnouncement,
  buildNewsletterAnnouncementBody,
  buildNewsletterAnnouncementMetadata,
  newsletterPublicPath,
  parseNewsletterAnnouncementMetadata,
  upsertMissionHubNewsletterAnnouncements,
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

function mockSpaces(ministry = true, newsletter = true) {
  vi.mocked(prisma.communitySpaceRecord.findFirst).mockImplementation((async (args: { where?: { slug?: string } }) => {
    const slug = (args?.where as { slug?: string } | undefined)?.slug;
    if (slug === "ministry-updates" && ministry) {
      return { id: "space-ministry", slug: "ministry-updates" } as never;
    }
    if (slug === NEWSLETTER_SPACE_SLUG && newsletter) {
      return { id: "space-newsletters", slug: NEWSLETTER_SPACE_SLUG } as never;
    }
    return null;
  }) as never);
}

describe("newsletter announcement builders", () => {
  it("builds metadata with target space and originating newsletter id", () => {
    const meta = buildNewsletterAnnouncementMetadata(sample, "newsletter");
    expect(meta.newsletterId).toBe("nl_test_1");
    expect(meta.originatingNewsletterId).toBe("nl_test_1");
    expect(meta.targetSpaceType).toBe("newsletter");
    expect(meta.newsletterPath).toBe("/newsletters/march-field-update");
  });

  it("builds teaser body with read link arrow", () => {
    const body = buildNewsletterAnnouncementBody(sample, "ministry_updates");
    expect(body).toContain("Read full newsletter → /newsletters/march-field-update");
    expect(body).not.toContain("Full newsletter body stays on the public page.");
  });

  it("builds richer newsletter-space body", () => {
    const body = buildNewsletterAnnouncementBody(sample, "newsletter");
    expect(body).toContain("New issue ·");
    expect(body).toContain("March Field Update");
    expect(body).toContain("Read full newsletter →");
  });

  it("parses announcement metadata for feed cards", () => {
    const meta = buildNewsletterAnnouncementMetadata(sample, "ministry_updates");
    const link = parseNewsletterAnnouncementMetadata(meta, NEWSLETTER_SOURCE_KIND);
    expect(link?.newsletterPath).toBe(newsletterPublicPath("march-field-update"));
  });
});

describe("upsertMissionHubNewsletterAnnouncements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSpaces(true, true);
    vi.mocked(prisma.communityPostRecord.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.communityPostRecord.create)
      .mockResolvedValueOnce({ id: "post-ministry" } as never)
      .mockResolvedValueOnce({ id: "post-newsletter" } as never);
  });

  it("creates posts in Ministry Updates and Newsletter spaces on first publish", async () => {
    const result = await upsertMissionHubNewsletterAnnouncements(sample, "admin-1");

    expect(result.ministryUpdates.created).toBe(true);
    expect(result.ministryUpdates.postId).toBe("post-ministry");
    expect(result.ministryUpdates.spaceSlug).toBe("ministry-updates");
    expect(result.newsletterSpace?.created).toBe(true);
    expect(result.newsletterSpace?.postId).toBe("post-newsletter");
    expect(result.newsletterSpace?.spaceSlug).toBe(NEWSLETTER_SPACE_SLUG);
    expect(prisma.communityPostRecord.create).toHaveBeenCalledTimes(2);
    expect(prisma.communityPostRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceKind: NEWSLETTER_SOURCE_KIND,
          sourceId: "nl_test_1",
          spaceId: "space-ministry",
        }),
      }),
    );
    expect(prisma.communityPostRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceKind: NEWSLETTER_SOURCE_KIND,
          sourceId: "nl_test_1",
          spaceId: "space-newsletters",
        }),
      }),
    );
  });

  it("updates existing posts per space on republish without duplicates", async () => {
    vi.mocked(prisma.communityPostRecord.findFirst).mockImplementation((async (args: { where?: { spaceId?: string } }) => {
      const spaceId = (args?.where as { spaceId?: string } | undefined)?.spaceId;
      if (spaceId === "space-ministry") return { id: "post-ministry" } as never;
      if (spaceId === "space-newsletters") return { id: "post-newsletter" } as never;
      return null;
    }) as never);
    vi.mocked(prisma.communityPostRecord.update)
      .mockResolvedValueOnce({ id: "post-ministry" } as never)
      .mockResolvedValueOnce({ id: "post-newsletter" } as never);

    const result = await upsertMissionHubNewsletterAnnouncements(sample, "admin-1");

    expect(result.ministryUpdates.created).toBe(false);
    expect(result.newsletterSpace?.created).toBe(false);
    expect(prisma.communityPostRecord.create).not.toHaveBeenCalled();
    expect(prisma.communityPostRecord.update).toHaveBeenCalledTimes(2);
  });

  it("degrades gracefully when Newsletter space is missing", async () => {
    mockSpaces(true, false);
    vi.mocked(prisma.communityPostRecord.create).mockReset();
    vi.mocked(prisma.communityPostRecord.create).mockResolvedValue({ id: "post-ministry" } as never);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await upsertMissionHubNewsletterAnnouncements(sample, "admin-1");

    expect(result.ministryUpdates.postId).toBe("post-ministry");
    expect(result.newsletterSpace).toBeNull();
    expect(prisma.communityPostRecord.create).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Newsletter space not found"),
      expect.objectContaining({ expectedSlug: NEWSLETTER_SPACE_SLUG }),
    );
    warn.mockRestore();
  });
});

describe("archiveMissionHubNewsletterAnnouncement", () => {
  it("archives all linked hub posts when newsletter is unpublished", async () => {
    vi.mocked(prisma.communityPostRecord.updateMany).mockResolvedValue({ count: 2 });

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

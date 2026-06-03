import { describe, expect, it, vi, beforeEach } from "vitest";
import type { BlogPostRecord } from "./types";

vi.mock("@/lib/db", () => ({
  prisma: {
    communitySpaceRecord: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    communityPostRecord: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/community/space-order", () => ({
  resolveSortOrderForNewSpace: vi.fn(async () => 10),
}));

import { prisma } from "@/lib/db";
import {
  BLOG_ARTICLES_SPACE_SLUG,
  BLOG_SOURCE_KIND,
  archiveMissionHubBlogAnnouncement,
  blogPublicPath,
  buildBlogAnnouncementBody,
  buildBlogAnnouncementMetadata,
  ensureBlogArticlesSpace,
  upsertMissionHubBlogAnnouncement,
} from "./mission-hub-announcement";

const sample: BlogPostRecord = {
  id: "blog_test_1",
  title: "Mission Update",
  slug: "mission-update",
  excerpt: "Highlights from the field.",
  body: "Full article body stays on the public blog page.\n\nSecond paragraph.",
  featuredImageUrl: "https://cdn.example.com/cover.jpg",
  featuredImageAlt: "Cover",
  status: "PUBLISHED",
  publishedAt: "2026-03-15T12:00:00.000Z",
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-15T12:00:00.000Z",
};

describe("blog announcement builders", () => {
  it("builds metadata with blog path and ids", () => {
    const meta = buildBlogAnnouncementMetadata(sample);
    expect(meta.blogPostId).toBe("blog_test_1");
    expect(meta.blogSlug).toBe("mission-update");
    expect(meta.blogPath).toBe("/blog/mission-update");
  });

  it("uses excerpt in announcement body with read link", () => {
    const body = buildBlogAnnouncementBody(sample);
    expect(body).toContain("Highlights from the field.");
    expect(body).toContain("Read the full article here: /blog/mission-update");
  });

  it("falls back to first paragraph when excerpt is empty", () => {
    const body = buildBlogAnnouncementBody({ ...sample, excerpt: "" });
    expect(body).toContain("Full article body stays on the public blog page.");
    expect(body).toContain("Read the full article here: /blog/mission-update");
  });

  it("builds public blog path from slug", () => {
    expect(blogPublicPath("hello-world")).toBe("/blog/hello-world");
  });
});

describe("ensureBlogArticlesSpace", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing published space without creating", async () => {
    vi.mocked(prisma.communitySpaceRecord.findUnique).mockResolvedValue({
      id: "space-blog",
      slug: BLOG_ARTICLES_SPACE_SLUG,
      status: "published",
    } as never);

    const result = await ensureBlogArticlesSpace();
    expect(result).toEqual({ id: "space-blog", slug: BLOG_ARTICLES_SPACE_SLUG, created: false });
    expect(prisma.communitySpaceRecord.create).not.toHaveBeenCalled();
  });

  it("auto-creates Blog Articles space when missing", async () => {
    vi.mocked(prisma.communitySpaceRecord.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.communitySpaceRecord.create).mockResolvedValue({
      id: "space-new",
      slug: BLOG_ARTICLES_SPACE_SLUG,
    } as never);

    const result = await ensureBlogArticlesSpace();
    expect(result.created).toBe(true);
    expect(prisma.communitySpaceRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          slug: BLOG_ARTICLES_SPACE_SLUG,
          status: "published",
        }),
      }),
    );
  });
});

describe("upsertMissionHubBlogAnnouncement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.communitySpaceRecord.findUnique).mockResolvedValue({
      id: "space-blog",
      slug: BLOG_ARTICLES_SPACE_SLUG,
      status: "published",
    } as never);
    vi.mocked(prisma.communityPostRecord.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.communityPostRecord.create).mockResolvedValue({ id: "post-blog-1" } as never);
  });

  it("creates Mission Hub post in blog-articles on first publish", async () => {
    const result = await upsertMissionHubBlogAnnouncement(sample, "admin-1");

    expect(result.created).toBe(true);
    expect(result.postId).toBe("post-blog-1");
    expect(result.spaceSlug).toBe(BLOG_ARTICLES_SPACE_SLUG);
    expect(prisma.communityPostRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceKind: BLOG_SOURCE_KIND,
          sourceId: "blog_test_1",
          postType: "blog",
          spaceId: "space-blog",
        }),
      }),
    );
  });

  it("updates existing post on republish instead of duplicating", async () => {
    vi.mocked(prisma.communityPostRecord.findFirst).mockResolvedValue({ id: "post-blog-1" } as never);
    vi.mocked(prisma.communityPostRecord.update).mockResolvedValue({ id: "post-blog-1" } as never);

    const result = await upsertMissionHubBlogAnnouncement(sample, "admin-1");

    expect(result.created).toBe(false);
    expect(prisma.communityPostRecord.create).not.toHaveBeenCalled();
    expect(prisma.communityPostRecord.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "post-blog-1" },
        data: expect.objectContaining({
          title: "Mission Update",
          sourceKind: BLOG_SOURCE_KIND,
          sourceId: "blog_test_1",
        }),
      }),
    );
  });
});

describe("archiveMissionHubBlogAnnouncement", () => {
  it("archives linked hub posts when blog is unpublished", async () => {
    vi.mocked(prisma.communityPostRecord.updateMany).mockResolvedValue({ count: 1 });

    const archived = await archiveMissionHubBlogAnnouncement("blog_test_1");
    expect(archived).toBe(1);
    expect(prisma.communityPostRecord.updateMany).toHaveBeenCalledWith({
      where: {
        sourceKind: BLOG_SOURCE_KIND,
        sourceId: "blog_test_1",
        status: { not: "archived" },
      },
      data: { status: "archived" },
    });
  });
});

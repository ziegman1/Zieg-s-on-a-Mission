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
  attachBlogAnnouncementToFeedItem,
  blogPublicPath,
  buildBlogAnnouncementBody,
  buildBlogAnnouncementMetadata,
  ensureBlogArticlesSpace,
  parseBlogAnnouncementMetadata,
  upsertMissionHubBlogAnnouncement,
} from "./mission-hub-announcement";
import type { CommunityPostFeedItemBase } from "@/lib/community/types";

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

describe("parseBlogAnnouncementMetadata", () => {
  const meta = buildBlogAnnouncementMetadata(sample);

  it("parses metadata when sourceKind is blog", () => {
    const link = parseBlogAnnouncementMetadata(meta, BLOG_SOURCE_KIND, "blog");
    expect(link).toEqual({
      blogPath: "/blog/mission-update",
      blogSlug: "mission-update",
      blogPostId: "blog_test_1",
    });
  });

  it("parses metadata when postType is blog", () => {
    const link = parseBlogAnnouncementMetadata(meta, null, "blog");
    expect(link?.blogPath).toBe("/blog/mission-update");
  });

  it("returns null for non-blog metadata kind", () => {
    expect(parseBlogAnnouncementMetadata({ kind: "other" }, BLOG_SOURCE_KIND, "blog")).toBeNull();
  });

  it("returns null when neither sourceKind nor postType indicate blog", () => {
    expect(parseBlogAnnouncementMetadata(meta, null, "update")).toBeNull();
  });

  it("derives path from slug when blogPath missing", () => {
    const link = parseBlogAnnouncementMetadata(
      { kind: "blog_announcement", blogPostId: "x", blogSlug: "fallback-slug" },
      BLOG_SOURCE_KIND,
      "blog",
    );
    expect(link?.blogPath).toBe("/blog/fallback-slug");
  });
});

describe("attachBlogAnnouncementToFeedItem", () => {
  const base: CommunityPostFeedItemBase = {
    id: "post-1",
    spaceId: "space-1",
    spaceTitle: "Blog Articles",
    spaceSlug: BLOG_ARTICLES_SPACE_SLUG,
    title: "Mission Update",
    body: "Teaser",
    excerpt: null,
    postType: "blog",
    coverImageUrl: null,
    publishedAt: "2026-03-15T12:00:00.000Z",
    authorName: "Team",
    authorImageUrl: null,
    authorAvatarName: "T",
    spaceAllowComments: true,
    spaceAllowReactions: true,
    spaceAllowVoiceMessages: false,
    spaceEngagementPrompt: null,
    spaceType: "standard",
  };

  it("attaches blogAnnouncement from metadata", () => {
    const meta = buildBlogAnnouncementMetadata(sample);
    const item = attachBlogAnnouncementToFeedItem(base, {
      sourceKind: BLOG_SOURCE_KIND,
      metadata: meta,
      postType: "blog",
      publishedAt: "2026-03-15T12:00:00.000Z",
    });
    expect(item.blogAnnouncement).toEqual({
      blogPath: "/blog/mission-update",
      blogSlug: "mission-update",
      blogPostId: "blog_test_1",
      publishedAt: "2026-03-15T12:00:00.000Z",
    });
  });

  it("leaves item unchanged when metadata is not a blog announcement", () => {
    const item = attachBlogAnnouncementToFeedItem(base, {
      sourceKind: "other",
      metadata: {},
      postType: "update",
    });
    expect(item.blogAnnouncement).toBeUndefined();
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

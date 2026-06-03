import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/blog/notify", () => ({
  notifyMissionHubMembersOfBlogPublish: vi.fn(),
}));

vi.mock("@/lib/blog/blog-db", () => ({
  saveBlogPost: vi.fn(),
  validateBlogPostInput: vi.fn(),
  getBlogPostById: vi.fn(),
}));

vi.mock("@/lib/blog/revalidate", () => ({
  revalidateBlogPaths: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  requireAdminSession: vi.fn(async () => ({ id: "admin-1" })),
}));

import { saveBlogPost } from "@/lib/blog/blog-db";
import { notifyMissionHubMembersOfBlogPublish } from "@/lib/blog/notify";
import { publishBlogPostAction } from "@/app/admin/site-builder/blog-actions";

describe("publishBlogPostAction hub failure handling", () => {
  it("returns ok with hubWarning when blog saves but Mission Hub sync fails", async () => {
    vi.mocked(saveBlogPost).mockResolvedValue({
      id: "blog_1",
      title: "Test Post",
      slug: "test-post",
      excerpt: "",
      body: "Body content",
      featuredImageUrl: null,
      featuredImageAlt: "",
      status: "PUBLISHED",
      publishedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    vi.mocked(notifyMissionHubMembersOfBlogPublish).mockRejectedValue(
      new Error("Mission Hub database unavailable"),
    );

    const result = await publishBlogPostAction({
      title: "Test Post",
      slug: "test-post",
      excerpt: "",
      body: "Body content",
      featuredImageUrl: null,
      featuredImageAlt: "",
      status: "PUBLISHED",
      publishedAt: null,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.post.status).toBe("PUBLISHED");
      expect(result.post.slug).toBe("test-post");
      expect(result.hubWarning).toContain("Blog published, but Mission Hub notification failed");
      expect(result.hubWarning).toContain("Mission Hub database unavailable");
      expect(result.hub).toBeUndefined();
    }
  });
});

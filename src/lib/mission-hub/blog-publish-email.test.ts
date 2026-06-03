import { describe, expect, it } from "vitest";
import {
  BLOG_PUBLISH_EMAIL_SUBJECT,
  buildBlogPublishEmailContent,
} from "./blog-publish-email";

describe("buildBlogPublishEmailContent", () => {
  it("includes blog title, excerpt, and links", () => {
    const content = buildBlogPublishEmailContent({
      blog: {
        title: "Mission Update",
        slug: "mission-update",
        excerpt: "Highlights from March.",
        body: "Body text",
      },
      missionHubPostUrl: "https://example.com/community/blog-articles#post-abc",
    });

    expect(content.subject).toBe(BLOG_PUBLISH_EMAIL_SUBJECT);
    expect(content.text).toContain("Mission Update");
    expect(content.text).toContain("Highlights from March.");
    expect(content.text).toContain("/blog/mission-update");
    expect(content.html).toContain("Read article");
  });
});

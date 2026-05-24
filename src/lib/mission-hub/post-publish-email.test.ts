import { describe, expect, it, vi } from "vitest";
import {
  buildPostPublishEmailContent,
  buildPostPublishEmailSubject,
} from "./post-publish-email";
import {
  buildNewsletterPublishEmailContent,
  NEWSLETTER_PUBLISH_EMAIL_SUBJECT,
} from "./newsletter-publish-email";

vi.mock("@/lib/mission-hub/site-url", () => ({
  absoluteMissionHubUrl: (path: string) => `https://example.com${path}`,
}));

describe("post publish email content", () => {
  it("uses space name in subject", () => {
    expect(buildPostPublishEmailSubject("Ministry Updates")).toBe(
      "New post in Ministry Updates",
    );
  });

  it("includes post link and settings in body", () => {
    const content = buildPostPublishEmailContent({
      spaceName: "Prayer Room",
      spaceSlug: "prayer",
      postId: "post-1",
      title: "Prayer request",
      body: "Please pray for our team.",
      excerpt: null,
    });
    expect(content.subject).toBe("New post in Prayer Room");
    expect(content.text).toContain("https://example.com/community/prayer#post-post-1");
    expect(content.text).toContain("/community/settings");
  });
});

describe("newsletter publish email content", () => {
  it("uses specialized newsletter subject and public page link", () => {
    const content = buildNewsletterPublishEmailContent({
      newsletter: {
        title: "March Update",
        slug: "march",
        excerpt: "Highlights",
        subtitle: "",
      },
      missionHubPostUrl: "https://example.com/community/newsletters#post-n1",
    });
    expect(content.subject).toBe(NEWSLETTER_PUBLISH_EMAIL_SUBJECT);
    expect(content.newsletterPublicUrl).toContain("/newsletters/march");
    expect(content.text).toContain("View in Mission Hub");
  });
});

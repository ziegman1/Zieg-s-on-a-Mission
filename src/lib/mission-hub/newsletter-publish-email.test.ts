import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NewsletterRecord } from "@/lib/newsletter/types";

vi.mock("@/lib/mission-hub/site-url", () => ({
  absoluteMissionHubUrl: (path: string) => `https://example.com${path}`,
}));

import {
  NEWSLETTER_PUBLISH_EMAIL_SUBJECT,
  buildNewsletterPublishEmailContent,
} from "./newsletter-publish-email";

const sampleNewsletter: Pick<NewsletterRecord, "title" | "slug" | "excerpt" | "subtitle"> = {
  title: "March Update",
  slug: "march-update",
  excerpt: "Highlights from March.",
  subtitle: "From the field",
};

describe("buildNewsletterPublishEmailContent", () => {
  it("includes title, excerpt, public newsletter link, Mission Hub post, and settings", () => {
    const content = buildNewsletterPublishEmailContent({
      newsletter: sampleNewsletter,
      missionHubPostUrl: "https://example.com/community/newsletters#post-1",
    });

    expect(content.subject).toBe(NEWSLETTER_PUBLISH_EMAIL_SUBJECT);
    expect(content.text).toContain("March Update");
    expect(content.text).toContain("Highlights from March.");
    expect(content.text).toContain("https://example.com/newsletters/march-update");
    expect(content.text).toContain("https://example.com/community/newsletters#post-1");
    expect(content.text).toContain("https://example.com/community/settings");
    expect(content.html).toContain("Read newsletter");
    expect(content.html).toContain("Manage notification preferences");
  });
});

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("NewsletterArchiveCard", () => {
  it("renders title-only archive row without social post chrome", () => {
    const card = readFileSync(
      resolve(process.cwd(), "src/components/community/newsletter-archive-card.tsx"),
      "utf8",
    );
    const archiveView = readFileSync(
      resolve(process.cwd(), "src/components/community/community-newsletter-archive-view.tsx"),
      "utf8",
    );
    const postCard = readFileSync(
      resolve(process.cwd(), "src/components/community/community-post-card.tsx"),
      "utf8",
    );

    expect(card).toContain("NewsletterArchiveCard");
    expect(card).toContain("item.title");
    expect(card).toContain("ChevronRight");
    expect(card).toContain("item.newsletterPath");
    expect(card).not.toContain("excerpt");
    expect(card).not.toContain("Read newsletter");
    expect(card).not.toContain("Read full newsletter");
    expect(card).not.toContain("CommunityPostCard");
    expect(card).not.toContain("CommunityComments");
    expect(card).not.toContain("reaction");
    expect(card).not.toContain("author");

    expect(archiveView).toContain("NewsletterArchiveCard");
    expect(archiveView).not.toContain("CommunityPostFeed");

    expect(postCard).toContain("CommunityComments");
  });

  it("newsletters space page uses archive from Newsletter model, not CommunityPostFeed", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/app/(storefront)/community/[slug]/page.tsx"),
      "utf8",
    );
    expect(page).toContain("listMissionHubNewsletterArchive");
    expect(page).toContain("CommunityNewsletterArchive");
    expect(page).toContain("isNewsletterArchiveSpace ? (");
    expect(page).toContain("<CommunityNewsletterArchive space={space} items={newsletterArchive} />");
  });

  it("all feed applies newsletters-space exclusion in query and render", () => {
    const posts = readFileSync(
      resolve(process.cwd(), "src/lib/community/posts.ts"),
      "utf8",
    );
    const feed = readFileSync(
      resolve(process.cwd(), "src/components/community/community-post-feed.tsx"),
      "utf8",
    );
    expect(posts).toContain("hubAllFeedPostWhere");
    expect(posts).toContain("filterHubAllFeedPosts");
    expect(feed).toContain("filterHubAllFeedPosts");
  });
});

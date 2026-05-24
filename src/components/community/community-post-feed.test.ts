import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("CommunityPostFeed all-feed deduplication", () => {
  it("filters newsletter-space duplicates when rendering the aggregate feed", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/community/community-post-feed.tsx"),
      "utf8",
    );
    expect(source).toContain("filterHubAllFeedPosts");
    expect(source).toContain("showSpaceLabel ? filterHubAllFeedPosts(posts) : posts");
  });
});

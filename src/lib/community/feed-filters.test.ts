import { describe, expect, it } from "vitest";
import {
  NEWSLETTER_SPACE_SLUG,
  MINISTRY_UPDATES_SPACE_SLUG,
} from "@/lib/newsletter/mission-hub-announcement";
import type { CommunityPostFeedItemBase } from "@/lib/community/types";
import {
  filterHubAllFeedPosts,
  hubAllFeedPostWhere,
  isNewslettersSpaceSlug,
  shouldIncludeInHubAllFeed,
} from "./feed-filters";

function feedPost(
  overrides: Partial<CommunityPostFeedItemBase> = {},
): CommunityPostFeedItemBase {
  return {
    id: "post-1",
    spaceId: "space-1",
    spaceTitle: "Newsletters",
    spaceSlug: NEWSLETTER_SPACE_SLUG,
    title: "March Update",
    body: "Teaser body that must not appear in archive cards",
    excerpt: null,
    postType: "newsletter",
    coverImageUrl: null,
    publishedAt: new Date().toISOString(),
    authorName: "Team",
    authorImageUrl: null,
    authorAvatarName: "T",
    spaceAllowComments: true,
    spaceAllowReactions: true,
    spaceAllowVoiceMessages: false,
    spaceEngagementPrompt: null,
    spaceType: "updates",
    ...overrides,
  };
}

describe("hub all feed filters", () => {
  it("identifies the Newsletters space by slug", () => {
    expect(isNewslettersSpaceSlug("newsletters")).toBe(true);
    expect(isNewslettersSpaceSlug("Newsletters")).toBe(true);
    expect(isNewslettersSpaceSlug("ministry-updates")).toBe(false);
  });

  it("excludes all posts in the Newsletters space from the All feed", () => {
    expect(shouldIncludeInHubAllFeed(NEWSLETTER_SPACE_SLUG)).toBe(false);
    expect(
      shouldIncludeInHubAllFeed(
        feedPost({ postType: "update", newsletterAnnouncement: undefined }).spaceSlug,
      ),
    ).toBe(false);
  });

  it("includes Ministry Updates newsletter announcements in the All feed", () => {
    expect(shouldIncludeInHubAllFeed(MINISTRY_UPDATES_SPACE_SLUG)).toBe(true);
  });

  it("includes ordinary posts in other spaces", () => {
    expect(shouldIncludeInHubAllFeed("prayer-room")).toBe(true);
  });

  it("hubAllFeedPostWhere excludes the entire Newsletters space", () => {
    expect(hubAllFeedPostWhere()).toEqual({
      status: "published",
      space: {
        status: "published",
        slug: { not: NEWSLETTER_SPACE_SLUG },
      },
    });
  });

  it("filterHubAllFeedPosts keeps ministry updates announcement only", () => {
    const ministry = feedPost({
      id: "ministry",
      spaceSlug: MINISTRY_UPDATES_SPACE_SLUG,
      spaceTitle: "Ministry Updates",
      newsletterAnnouncement: {
        newsletterPath: "/newsletters/march",
        newsletterSlug: "march",
        issueDate: null,
        ctaLabel: null,
        ctaUrl: null,
      },
    });
    const newslettersSpacePost = feedPost({
      id: "nl-space",
      spaceSlug: NEWSLETTER_SPACE_SLUG,
      postType: "update",
      newsletterAnnouncement: undefined,
    });

    const filtered = filterHubAllFeedPosts([ministry, newslettersSpacePost]);
    expect(filtered.map((p) => p.id)).toEqual(["ministry"]);
  });
});

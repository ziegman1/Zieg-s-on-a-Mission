import { describe, expect, it } from "vitest";
import {
  BLOG_ARTICLES_SPACE_SLUG,
  BLOG_SOURCE_KIND,
} from "@/lib/blog/mission-hub-announcement";
import { MINISTRY_UPDATES_SPACE_SLUG } from "@/lib/newsletter/mission-hub-announcement";
import {
  buildWeeklyMissionHubDigest,
  classifyDigestPostSection,
  commentRowToDigestItem,
  isWithinDigestWindow,
  resolveDigestDateRange,
  type DigestCommentInput,
  type DigestPostInput,
} from "./weekly-digest-core";

function post(overrides: Partial<DigestPostInput> & Pick<DigestPostInput, "id">): DigestPostInput {
  return {
    title: "Sample title",
    body: "Sample body text for the post.",
    excerpt: null,
    postType: "update",
    sourceKind: null,
    publishedAt: new Date("2026-06-08T12:00:00.000Z"),
    createdAt: new Date("2026-06-08T12:00:00.000Z"),
    space: {
      title: "Ministry Updates",
      slug: MINISTRY_UPDATES_SPACE_SLUG,
      spaceType: "standard",
      settings: { notificationCategory: "ministry_updates" },
    },
    authorUser: null,
    ...overrides,
  };
}

describe("weekly Mission Hub digest generator", () => {
  const range = {
    start: "2026-06-03T12:00:00.000Z",
    end: "2026-06-10T12:00:00.000Z",
  };

  it("returns hasContent false for an empty week", () => {
    const digest = buildWeeklyMissionHubDigest({
      dateRange: range,
      posts: [],
      newsletters: [],
      comments: [],
      reactionCount: 0,
    });

    expect(digest.hasContent).toBe(false);
    expect(digest.deliveryEnabled).toBe(false);
    expect(digest.sections.every((s) => s.items.length === 0)).toBe(true);
    expect(digest.totals.publishedPosts).toBe(0);
  });

  it("places prayer posts in Prayer & Praise", () => {
    const digest = buildWeeklyMissionHubDigest({
      dateRange: range,
      posts: [
        post({
          id: "prayer-1",
          postType: "prayer",
          space: {
            title: "Prayer & Praise Room",
            slug: "prayer-and-praise-room",
            spaceType: "prayer_room",
            settings: { notificationCategory: "prayer_requests" },
          },
        }),
      ],
      newsletters: [],
      comments: [],
      reactionCount: 0,
    });

    const section = digest.sections.find((s) => s.id === "prayer_and_praise");
    expect(section?.items).toHaveLength(1);
    expect(section?.items[0].postType).toBe("prayer");
    expect(digest.totals.prayerRequests).toBe(1);
    expect(digest.hasContent).toBe(true);
  });

  it("places blog posts in Blog Articles", () => {
    const digest = buildWeeklyMissionHubDigest({
      dateRange: range,
      posts: [
        post({
          id: "blog-1",
          postType: "blog",
          sourceKind: BLOG_SOURCE_KIND,
          space: {
            title: "Blog Articles",
            slug: BLOG_ARTICLES_SPACE_SLUG,
            spaceType: "standard",
            settings: { notificationCategory: "blog_articles" },
          },
        }),
      ],
      newsletters: [],
      comments: [],
      reactionCount: 0,
    });

    const section = digest.sections.find((s) => s.id === "blog_articles");
    expect(section?.items).toHaveLength(1);
    expect(digest.totals.blogArticles).toBe(1);
  });

  it("places ministry updates in Ministry Updates", () => {
    const digest = buildWeeklyMissionHubDigest({
      dateRange: range,
      posts: [post({ id: "mu-1", postType: "update" })],
      newsletters: [],
      comments: [],
      reactionCount: 0,
    });

    const section = digest.sections.find((s) => s.id === "ministry_updates");
    expect(section?.items).toHaveLength(1);
    expect(digest.totals.ministryUpdates).toBe(1);
  });

  it("counts comments and voice prayers in Community Activity", () => {
    const comment: DigestCommentInput = {
      id: "c1",
      body: JSON.stringify({
        kind: "voice_prayer",
        audioUrl: "https://example.com/a.mp3",
      }),
      displayName: "Jane Doe",
      createdAt: new Date("2026-06-09T00:00:00.000Z"),
      member: null,
      post: {
        id: "post-1",
        title: "Pray for us",
        space: { title: "Prayer Room", slug: "prayer-and-praise-room" },
      },
    };

    const digest = buildWeeklyMissionHubDigest({
      dateRange: range,
      posts: [],
      newsletters: [],
      comments: [comment],
      reactionCount: 2,
    });

    const activity = digest.sections.find((s) => s.id === "community_activity");
    expect(activity?.items).toHaveLength(1);
    expect(activity?.items[0].isVoicePrayer).toBe(true);
    expect(digest.totals.comments).toBe(1);
    expect(digest.totals.voicePrayers).toBe(1);
    expect(digest.totals.reactions).toBe(2);
  });

  it("filters by custom date range", () => {
    const end = new Date("2026-06-10T12:00:00.000Z");
    const start = new Date("2026-06-01T00:00:00.000Z");
    const resolved = resolveDigestDateRange({ start, end });
    expect(resolved.start.toISOString()).toBe(start.toISOString());
    expect(resolved.end.toISOString()).toBe(end.toISOString());

    expect(
      isWithinDigestWindow("2026-05-20T00:00:00.000Z", { start, end }),
    ).toBe(false);
    expect(
      isWithinDigestWindow("2026-06-05T00:00:00.000Z", { start, end }),
    ).toBe(true);
  });

  it("classifies praise reports under Prayer & Praise", () => {
    expect(
      classifyDigestPostSection(
        post({
          id: "p",
          postType: "praise",
          space: {
            title: "Prayer Room",
            slug: "prayer-and-praise-room",
            spaceType: "prayer_room",
            settings: {},
          },
        }),
      ),
    ).toBe("prayer_and_praise");
  });

  it("maps comment rows with author and href", () => {
    const item = commentRowToDigestItem({
      id: "c2",
      body: "Praying with you!",
      displayName: null,
      createdAt: new Date("2026-06-08T00:00:00.000Z"),
      member: { firstName: "Sam", lastName: "Lee", displayName: null },
      post: {
        id: "post-9",
        title: "Need provision",
        space: { title: "Prayer Room", slug: "prayer-and-praise-room" },
      },
    });

    expect(item.title).toContain("Need provision");
    expect(item.authorDisplayName).toBe("Sam Lee");
    expect(item.href).toBe("/community/prayer-and-praise-room#post-post-9");
    expect(item.isVoicePrayer).toBe(false);
  });
});

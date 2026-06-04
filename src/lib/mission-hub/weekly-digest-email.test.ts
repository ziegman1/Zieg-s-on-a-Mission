import { describe, expect, it, vi } from "vitest";
import {
  buildWeeklyDigestEmailContent,
  WEEKLY_DIGEST_EMAIL_SUBJECT,
} from "@/lib/mission-hub/weekly-digest-email";
import type { WeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest-core";

vi.mock("@/lib/mission-hub/site-url", () => ({
  absoluteMissionHubUrl: (path: string) => `https://example.com${path}`,
}));

function sampleDigest(overrides: Partial<WeeklyMissionHubDigest> = {}): WeeklyMissionHubDigest {
  return {
    prepared: true,
    deliveryEnabled: false,
    dateRange: {
      start: "2026-06-03T12:00:00.000Z",
      end: "2026-06-10T12:00:00.000Z",
    },
    sections: [
      {
        id: "prayer_and_praise",
        title: "Prayer & Praise",
        items: [
          {
            id: "p1",
            kind: "post",
            title: "Pray for the team",
            excerpt: "Short preview",
            spaceName: "Prayer Room",
            spaceSlug: "prayer-and-praise-room",
            href: "/community/prayer-and-praise-room#post-p1",
            publishedAt: "2026-06-08T00:00:00.000Z",
            authorDisplayName: "Alex",
          },
        ],
      },
      {
        id: "ministry_updates",
        title: "Ministry Updates",
        items: [],
      },
      {
        id: "blog_articles",
        title: "Blog Articles",
        items: [
          {
            id: "b1",
            kind: "post",
            title: "Field notes",
            excerpt: null,
            spaceName: "Blog Articles",
            spaceSlug: "blog-articles",
            href: "/community/blog-articles#post-b1",
            publishedAt: "2026-06-07T00:00:00.000Z",
            authorDisplayName: null,
          },
        ],
      },
      {
        id: "resources",
        title: "Resources",
        items: [],
      },
      {
        id: "newsletters",
        title: "Newsletters",
        items: [],
      },
      {
        id: "community_activity",
        title: "Community Activity",
        items: [],
      },
    ],
    totals: {
      prayerRequests: 1,
      praiseReports: 0,
      encouragementPosts: 0,
      ministryUpdates: 0,
      blogArticles: 1,
      resources: 0,
      newsletters: 0,
      comments: 0,
      voicePrayers: 0,
      reactions: 0,
      publishedPosts: 2,
    },
    hasContent: true,
    digestEmailRecipientsPrepared: 3,
    ...overrides,
  };
}

describe("buildWeeklyDigestEmailContent", () => {
  it("uses the weekly digest subject and date range", () => {
    const content = buildWeeklyDigestEmailContent(sampleDigest());
    expect(content.subject).toBe(WEEKLY_DIGEST_EMAIL_SUBJECT);
    expect(content.text).toContain("June 3, 2026");
    expect(content.text).toContain("June 10, 2026");
  });

  it("renders only sections with content", () => {
    const content = buildWeeklyDigestEmailContent(sampleDigest());
    expect(content.text).toContain("Prayer & Praise");
    expect(content.text).toContain("Blog Articles");
    expect(content.text).not.toContain("Ministry Updates\n-");
    expect(content.html).toContain("Prayer &amp; Praise");
    expect(content.html).not.toContain("Ministry Updates");
    expect(content.html).not.toContain("Resources");
  });

  it("includes Mission Hub CTA and item links", () => {
    const content = buildWeeklyDigestEmailContent(sampleDigest());
    expect(content.text).toContain("Open Mission Hub: https://example.com/community");
    expect(content.text).toContain("https://example.com/community/prayer-and-praise-room#post-p1");
    expect(content.html).toContain("Open Mission Hub");
    expect(content.html).toContain("https://example.com/community/blog-articles#post-b1");
  });

  it("renders empty digest without section blocks", () => {
    const empty = sampleDigest({
      hasContent: false,
      sections: sampleDigest().sections.map((section) => ({ ...section, items: [] })),
    });
    const content = buildWeeklyDigestEmailContent(empty);
    expect(content.text).not.toContain("Prayer & Praise");
    expect(content.html).not.toContain("<h2");
  });
});

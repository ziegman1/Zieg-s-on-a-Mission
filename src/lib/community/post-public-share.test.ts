import { describe, expect, it } from "vitest";
import { BLOG_SOURCE_KIND } from "@/lib/blog/mission-hub-announcement";
import { NEWSLETTER_SOURCE_KIND } from "@/lib/newsletter/mission-hub-announcement";
import {
  buildFacebookShareCaption,
  buildSharePreview,
  communitySharePagePath,
  evaluatePostShareEligibility,
  mergePublicShareMetadata,
  parsePublicShareMetadata,
  resolvePreferredSharePath,
} from "./post-public-share";

const VOICE_BODY = JSON.stringify({
  kind: "voice_prayer",
  audioUrl: "https://cdn.example.com/audio.mp3",
});

function eligibility(overrides: Partial<Parameters<typeof evaluatePostShareEligibility>[0]> = {}) {
  return evaluatePostShareEligibility({
    status: "published",
    body: "Ministry update body text.",
    postType: "update",
    sourceKind: null,
    metadata: {},
    authorRole: "ADMIN",
    spaceStatus: "published",
    spaceSlug: "ministry-updates",
    ...overrides,
  });
}

describe("evaluatePostShareEligibility", () => {
  it("blocks draft posts", () => {
    const result = eligibility({ status: "draft" });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toMatch(/draft/i);
  });

  it("blocks archived posts", () => {
    const result = eligibility({ status: "archived" });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toMatch(/archived/i);
  });

  it("blocks unpublished spaces", () => {
    const result = eligibility({ spaceStatus: "draft" });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toMatch(/space is not published/i);
  });

  it("blocks member-authored prayer requests", () => {
    const result = eligibility({
      authorRole: "CUSTOMER",
      postType: "prayer",
      spaceSlug: "prayer-and-praise-room",
      body: "Please pray for our family during this season.",
    });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toMatch(/member-authored/i);
  });

  it("blocks voice prayer posts", () => {
    const result = eligibility({ body: VOICE_BODY, authorRole: "ADMIN" });
    expect(result.eligible).toBe(false);
    if (!result.eligible) expect(result.reason).toMatch(/voice/i);
  });

  it("allows published ministry updates from admins", () => {
    expect(eligibility()).toEqual({ eligible: true });
  });
});

describe("parsePublicShareMetadata", () => {
  it("returns null when sharing is disabled", () => {
    expect(parsePublicShareMetadata({})).toBeNull();
    expect(parsePublicShareMetadata({ publicShare: { enabled: false } })).toBeNull();
  });

  it("parses enabled share metadata", () => {
    const meta = parsePublicShareMetadata({
      publicShare: {
        enabled: true,
        enabledAt: "2026-05-24T12:00:00.000Z",
        enabledByUserId: "admin-1",
        shareExcerpt: "Safe excerpt",
      },
    });
    expect(meta?.enabled).toBe(true);
    expect(meta?.shareExcerpt).toBe("Safe excerpt");
  });
});

describe("resolvePreferredSharePath", () => {
  it("prefers blog public URL for blog announcements", () => {
    const result = resolvePreferredSharePath({
      postId: "post-1",
      sourceKind: BLOG_SOURCE_KIND,
      metadata: {
        kind: "blog_announcement",
        blogSlug: "field-story",
        blogPath: "/blog/field-story",
        blogPostId: "blog-1",
      },
      postType: "blog",
    });
    expect(result).toEqual({ path: "/blog/field-story", usesHubSharePage: false });
  });

  it("prefers newsletter public URL for newsletter announcements", () => {
    const result = resolvePreferredSharePath({
      postId: "post-2",
      sourceKind: NEWSLETTER_SOURCE_KIND,
      metadata: {
        kind: "newsletter_announcement",
        newsletterSlug: "may-update",
        newsletterPath: "/newsletters/may-update",
        newsletterId: "nl-1",
        originatingNewsletterId: "nl-1",
        issueDate: null,
        ctaLabel: null,
        ctaUrl: null,
        targetSpaceType: "ministry_updates",
      },
      postType: "newsletter",
    });
    expect(result).toEqual({ path: "/newsletters/may-update", usesHubSharePage: false });
  });

  it("uses Mission Hub share page for standard updates", () => {
    const result = resolvePreferredSharePath({
      postId: "post-3",
      sourceKind: null,
      metadata: {},
      postType: "update",
    });
    expect(result).toEqual({
      path: communitySharePagePath("post-3"),
      usesHubSharePage: true,
    });
  });
});

describe("buildFacebookShareCaption", () => {
  it("includes Mission Hub invitation and join link", () => {
    const caption = buildFacebookShareCaption({
      shareUrl: "https://www.ziegsonamission.com/community/share/abc",
      postSummary: "Ministry Updates\n\nGod is at work in the field.",
      joinUrl: "https://www.ziegsonamission.com/community/join",
    });
    expect(caption).toContain("Mission Hub is our online gathering place");
    expect(caption).toContain("https://www.ziegsonamission.com/community/join");
    expect(caption).toContain("Read the update here");
    expect(caption).toContain("God is at work in the field.");
  });
});

describe("buildSharePreview", () => {
  it("uses stored excerpt and strips unsafe body exposure", () => {
    const preview = buildSharePreview({
      postId: "post-1",
      title: "Field update",
      body: "Full body with <b>html</b> and extra detail that should not all appear.",
      excerpt: "Safe stored excerpt for sharing.",
      coverImageUrl: "https://cdn.example.com/cover.jpg",
      publishedAt: new Date("2026-05-24T12:00:00.000Z"),
      createdAt: new Date("2026-05-24T12:00:00.000Z"),
      spaceTitle: "Ministry Updates",
      spaceSlug: "ministry-updates",
      sourceKind: null,
      metadata: {},
      postType: "update",
    });
    expect(preview.excerpt).toBe("Safe stored excerpt for sharing.");
    expect(preview.excerpt).not.toContain("<b>");
  });
});

describe("mergePublicShareMetadata", () => {
  it("preserves existing metadata keys", () => {
    const merged = mergePublicShareMetadata(
      { kind: "blog_announcement", blogSlug: "x" },
      {
        enabled: true,
        enabledAt: "2026-05-24T12:00:00.000Z",
        enabledByUserId: "admin-1",
      },
    );
    expect(merged.kind).toBe("blog_announcement");
    expect(parsePublicShareMetadata(merged)?.enabled).toBe(true);
  });
});

describe("public share page contract", () => {
  it("share page includes Join Mission Hub CTA and excludes engagement UI", async () => {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const page = readFileSync(
      resolve(process.cwd(), "src/app/(storefront)/community/share/[postId]/page.tsx"),
      "utf8",
    );
    expect(page).toContain("Join Mission Hub");
    expect(page).toContain("MISSION_HUB_JOIN_PATH");
    expect(page).toContain("Read in Mission Hub");
    expect(page).toContain("MISSION_HUB_SHARE_INVITATION");
    expect(page).not.toContain("CommunityComments");
    expect(page).not.toContain("CommunityEngagementBar");
    expect(page).not.toContain("authorName");
    expect(page).not.toContain("reaction");
  });

  it("share page loader requires enabled metadata", async () => {
    const { readFileSync } = await import("fs");
    const { resolve } = await import("path");
    const server = readFileSync(
      resolve(process.cwd(), "src/lib/community/post-public-share-server.ts"),
      "utf8",
    );
    expect(server).toContain("parsePublicShareMetadata");
    expect(server).toContain("if (!shareMeta?.enabled) return null");
    expect(server).toContain("evaluateShareRecordEligibility");
  });
});

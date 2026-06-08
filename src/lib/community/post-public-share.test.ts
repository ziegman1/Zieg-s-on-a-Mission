import { describe, expect, it } from "vitest";
import { BLOG_SOURCE_KIND } from "@/lib/blog/mission-hub-announcement";
import { NEWSLETTER_SOURCE_KIND } from "@/lib/newsletter/mission-hub-announcement";
import {
  buildFacebookShareCaption,
  buildPostShareAssets,
  buildSharePageSocialMetadata,
  buildSharePreview,
  collectShareImageUrls,
  communitySharePagePath,
  evaluatePostShareEligibility,
  mergePublicShareMetadata,
  parsePublicShareMetadata,
  resolvePreferredSharePath,
  truncateShareExcerpt,
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
  it("uses content-focused template without Mission Hub explanatory text", () => {
    const caption = buildFacebookShareCaption({
      shareUrl: "https://www.ziegsonamission.com/community/share/abc",
      excerpt: "God is at work in the field.",
    });
    expect(caption).toBe(`New Update in Mission Hub

God is at work in the field.

Read the full update in Mission Hub:

https://www.ziegsonamission.com/community/share/abc`);
    expect(caption).not.toContain("Join Mission Hub");
    expect(caption).not.toContain("online gathering place");
  });
});

describe("truncateShareExcerpt", () => {
  it("prefers sentence boundaries between 220 and 350 characters", () => {
    const text =
      "A".repeat(230) +
      ". " +
      "B".repeat(50) +
      ". " +
      "C".repeat(100);
    const result = truncateShareExcerpt(text);
    expect(result.endsWith("...")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(353);
    expect(result).toContain(".");
  });
});

describe("buildPostShareAssets", () => {
  it("returns future-ready payload with caption, url, featured image, and images array", () => {
    const preview = buildSharePreview({
      postId: "post-1",
      title: "Field update",
      body: "Body",
      excerpt: "Safe excerpt for sharing.",
      coverImageUrl: "https://cdn.example.com/cover.jpg",
      publishedAt: new Date("2026-05-24T12:00:00.000Z"),
      createdAt: new Date("2026-05-24T12:00:00.000Z"),
      spaceTitle: "Ministry Updates",
      spaceSlug: "ministry-updates",
      sourceKind: null,
      metadata: {
        galleryImages: ["https://cdn.example.com/gallery-1.jpg"],
      },
      postType: "update",
    });

    const assets = buildPostShareAssets({
      preview,
      shareUrl: "https://www.ziegsonamission.com/community/share/post-1",
      metadata: {
        galleryImages: ["https://cdn.example.com/gallery-1.jpg"],
      },
      coverImageUrl: "https://cdn.example.com/cover.jpg",
    });

    expect(assets.caption).toContain("New Update in Mission Hub");
    expect(assets.shareUrl).toBe("https://www.ziegsonamission.com/community/share/post-1");
    expect(assets.featuredImage).toBe("https://cdn.example.com/cover.jpg");
    expect(assets.images).toHaveLength(2);
    expect(assets.images[0]?.url).toBe("https://cdn.example.com/cover.jpg");
  });
});

describe("collectShareImageUrls", () => {
  it("dedupes cover and gallery images", () => {
    const urls = collectShareImageUrls({
      coverImageUrl: "https://cdn.example.com/cover.jpg",
      metadata: {
        galleryImages: [
          "https://cdn.example.com/cover.jpg",
          "https://cdn.example.com/extra.jpg",
        ],
      },
    });
    expect(urls).toEqual([
      "https://cdn.example.com/cover.jpg",
      "https://cdn.example.com/extra.jpg",
    ]);
  });
});

describe("buildSharePageSocialMetadata", () => {
  it("builds absolute og and twitter image urls from post fields", () => {
    const preview = buildSharePreview({
      postId: "post-1",
      title: "Field update",
      body: "Body",
      excerpt: "Excerpt for social cards.",
      coverImageUrl: "https://cdn.example.com/cover.jpg",
      publishedAt: new Date("2026-05-24T12:00:00.000Z"),
      createdAt: new Date("2026-05-24T12:00:00.000Z"),
      spaceTitle: "Ministry Updates",
      spaceSlug: "ministry-updates",
      sourceKind: null,
      metadata: {},
      postType: "update",
    });

    const social = buildSharePageSocialMetadata(
      preview,
      "https://www.ziegsonamission.com",
    );

    expect(social.title).toBe("Field update");
    expect(social.description).toBe("Excerpt for social cards.");
    expect(social.canonical).toBe("https://www.ziegsonamission.com/community/share/post-1");
    expect(social.ogImage).toBe("https://cdn.example.com/cover.jpg");
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
    expect(page).toContain("buildSharePageSocialMetadata");
    expect(page).toContain("openGraph");
    expect(page).toContain("twitter");
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

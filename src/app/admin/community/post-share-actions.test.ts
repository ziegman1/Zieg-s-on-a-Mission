import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/community/owner", () => ({
  requireCommunityOwner: vi.fn(),
}));

vi.mock("@/lib/mission-hub/site-url", () => ({
  absoluteMissionHubUrl: vi.fn((path: string) => `https://www.ziegsonamission.com${path}`),
}));

vi.mock("@/lib/community/post-public-share-server", () => ({
  loadPostShareRecord: vi.fn(),
  evaluateShareRecordEligibility: vi.fn(),
  buildPreviewFromShareRecord: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    communityPostRecord: {
      update: vi.fn(),
    },
  },
}));

import { requireCommunityOwner } from "@/lib/community/owner";
import {
  buildPreviewFromShareRecord,
  evaluateShareRecordEligibility,
  loadPostShareRecord,
} from "@/lib/community/post-public-share-server";
import { prisma } from "@/lib/db";
import { enableCommunityPostFacebookShareAction } from "./post-share-actions";

const sampleRecord = {
  id: "post-1",
  status: "published",
  title: "Ministry update",
  body: "Update body",
  excerpt: "Safe excerpt",
  postType: "update",
  coverImageUrl: null,
  publishedAt: new Date("2026-05-24T12:00:00.000Z"),
  createdAt: new Date("2026-05-24T12:00:00.000Z"),
  sourceKind: null,
  metadata: {},
  authorRole: "ADMIN",
  spaceStatus: "published",
  spaceSlug: "ministry-updates",
  spaceTitle: "Ministry Updates",
};

const samplePreview = {
  postId: "post-1",
  title: "Ministry update",
  excerpt: "Safe excerpt",
  spaceTitle: "Ministry Updates",
  spaceSlug: "ministry-updates",
  publishedAt: "2026-05-24T12:00:00.000Z",
  coverImageUrl: null,
  hubPostPath: "/community/ministry-updates#post-post-1",
  sharePagePath: "/community/share/post-1",
  preferredSharePath: "/community/share/post-1",
  usesHubSharePage: true,
};

describe("enableCommunityPostFacebookShareAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireCommunityOwner).mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      name: "Admin",
      role: "ADMIN",
    });
    vi.mocked(loadPostShareRecord).mockResolvedValue(sampleRecord);
    vi.mocked(evaluateShareRecordEligibility).mockReturnValue({ eligible: true });
    vi.mocked(buildPreviewFromShareRecord).mockReturnValue(samplePreview);
    vi.mocked(prisma.communityPostRecord.update).mockResolvedValue({} as never);
  });

  it("returns share URLs and content-focused assets for eligible posts", async () => {
    vi.mocked(loadPostShareRecord).mockResolvedValue({
      ...sampleRecord,
      coverImageUrl: "https://cdn.example.com/cover.jpg",
    });
    vi.mocked(buildPreviewFromShareRecord).mockReturnValue({
      ...samplePreview,
      coverImageUrl: "https://cdn.example.com/cover.jpg",
    });

    const result = await enableCommunityPostFacebookShareAction("post-1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.shareUrl).toBe("https://www.ziegsonamission.com/community/share/post-1");
    expect(result.facebookShareUrl).toContain("facebook.com/sharer/sharer.php");
    expect(result.assets.caption).toContain("New Update in Mission Hub");
    expect(result.assets.caption).not.toContain("online gathering place");
    expect(result.suggestedCaption).toBe(result.assets.caption);
    expect(result.assets.featuredImage).toBe("https://cdn.example.com/cover.jpg");
    expect(prisma.communityPostRecord.update).toHaveBeenCalled();
  });

  it("returns admin-facing reason when post is not eligible", async () => {
    vi.mocked(evaluateShareRecordEligibility).mockReturnValue({
      eligible: false,
      reason: "Draft posts cannot be shared. Publish the post first.",
    });

    const result = await enableCommunityPostFacebookShareAction("post-1");
    expect(result).toEqual({
      ok: false,
      error: "Draft posts cannot be shared. Publish the post first.",
    });
    expect(prisma.communityPostRecord.update).not.toHaveBeenCalled();
  });

  it("rejects unauthorized callers", async () => {
    vi.mocked(requireCommunityOwner).mockResolvedValue(null);
    const result = await enableCommunityPostFacebookShareAction("post-1");
    expect(result).toEqual({ ok: false, error: "Unauthorized" });
  });
});

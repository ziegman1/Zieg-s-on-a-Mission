import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("share assets API route", () => {
  it("returns future-ready assets payload for admin callers", () => {
    const route = readFileSync(
      resolve(
        process.cwd(),
        "src/app/api/admin/community/posts/[postId]/share-assets/route.ts",
      ),
      "utf8",
    );
    expect(route).toContain("isAdminRole");
    expect(route).toContain("buildShareAssetsFromRecord");
    expect(route).toContain("NextResponse.json(assets)");
  });
});

describe("share dialog admin actions", () => {
  it("includes personal timeline and Facebook group share dialogs", () => {
    const menu = readFileSync(
      resolve(process.cwd(), "src/components/community/community-post-owner-menu.tsx"),
      "utf8",
    );
    expect(menu).toContain("Share to Facebook");
    expect(menu).toContain("Share to Facebook Group");
    expect(menu).toContain("CommunityPostFacebookGroupShareDialog");

    const timeline = readFileSync(
      resolve(process.cwd(), "src/components/community/community-post-share-dialog.tsx"),
      "utf8",
    );
    expect(timeline).toContain("Open Facebook");
    expect(timeline).toContain("facebookShareUrl");

    const group = readFileSync(
      resolve(process.cwd(), "src/components/community/community-post-facebook-group-share-dialog.tsx"),
      "utf8",
    );
    expect(group).toContain("FACEBOOK_GROUP_SHARE_INSTRUCTIONS");
    expect(group).toContain("Copy Caption");
    expect(group).toContain("Download Images");
    expect(group).toContain("No images are attached to this update.");
    expect(group).not.toContain("facebookShareUrl");
    expect(group).not.toContain("Open Facebook");
  });
});

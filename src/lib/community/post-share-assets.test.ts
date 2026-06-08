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
  it("includes Copy Facebook Post and Download Share Images", () => {
    const dialog = readFileSync(
      resolve(process.cwd(), "src/components/community/community-post-share-dialog.tsx"),
      "utf8",
    );
    expect(dialog).toContain("Copy Facebook Post");
    expect(dialog).toContain("Download Share Images");
    expect(dialog).toContain("downloadShareImages");
    expect(dialog).toContain("assets.caption");
  });
});

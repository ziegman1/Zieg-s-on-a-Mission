import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("admin members hub preview", () => {
  it("layout loads lightweight preview only for owners", () => {
    const layout = readFileSync(
      resolve(process.cwd(), "src/app/(storefront)/community/layout.tsx"),
      "utf8",
    );
    expect(layout).toContain("getAdminMembersHubPreview");
    expect(layout).toContain("if (owner)");
    expect(layout).toContain("membersPreview={membersPreview}");
  });

  it("panel action loads full list on demand", () => {
    const actions = readFileSync(
      resolve(process.cwd(), "src/app/(storefront)/community/hub-admin-members-actions.ts"),
      "utf8",
    );
    expect(actions).toContain("listMembersForAdminPortal");
    expect(actions).toContain("requireCommunityOwner");
  });
});

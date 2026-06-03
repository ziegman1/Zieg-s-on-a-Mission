import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("Mission Hub topbar create", () => {
  it("delegates to CommunityOwnerCreateBar with a path-agnostic create menu", () => {
    const topbarCreate = readFileSync(
      resolve(process.cwd(), "src/components/community/community-topbar-create.tsx"),
      "utf8",
    );
    const ownerBar = readFileSync(
      resolve(process.cwd(), "src/components/community/community-owner-create-bar.tsx"),
      "utf8",
    );

    expect(topbarCreate).toContain('variant="topbar"');
    expect(topbarCreate).toContain("CommunityOwnerCreateBar");
    expect(topbarCreate).not.toContain("resolveCreateMode");
    expect(topbarCreate).not.toContain("/community/spaces");
    expect(topbarCreate).toContain("if (!owner) return null");

    expect(ownerBar).toContain("Create space");
    expect(ownerBar).toContain("Create post");
    expect(ownerBar).toContain("CommunityCreateSpaceDialog");
    expect(ownerBar).toContain("CommunityCreatePostDialog");
    expect(ownerBar).toContain("CommunityBottomSheet");
  });

  it("opens space flow directly instead of routing to the spaces index", () => {
    const ownerBar = readFileSync(
      resolve(process.cwd(), "src/components/community/community-owner-create-bar.tsx"),
      "utf8",
    );

    expect(ownerBar).toContain("setSpaceOpen(true)");
    expect(ownerBar).not.toContain('href="/community/spaces"');
    expect(ownerBar).not.toContain("router.push");
  });

  it("shows the create control for admins on every Mission Hub page", () => {
    const topbarCreate = readFileSync(
      resolve(process.cwd(), "src/components/community/community-topbar-create.tsx"),
      "utf8",
    );

    expect(topbarCreate).not.toContain("mode !== null");
    expect(topbarCreate).not.toContain("resolveCreateMode");
    expect(topbarCreate).toContain("canCreatePost={published.length > 0}");
  });
});

describe("Space notification category", () => {
  it("stores categories in community space settings JSON schema", () => {
    const settingsTypes = readFileSync(
      resolve(process.cwd(), "src/lib/community/settings-types.ts"),
      "utf8",
    );
    const experienceForm = readFileSync(
      resolve(process.cwd(), "src/components/community/community-space-experience-form.tsx"),
      "utf8",
    );

    expect(settingsTypes).toContain("notificationCategory");
    expect(experienceForm).toContain("Notification category");
    expect(experienceForm).toContain("SPACE_NOTIFICATION_CATEGORIES");
  });
});

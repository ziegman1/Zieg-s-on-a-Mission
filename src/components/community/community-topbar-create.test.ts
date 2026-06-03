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

describe("Mission Hub create space flow", () => {
  it("navigates to the new space after successful mobile creation", () => {
    const flow = readFileSync(
      resolve(process.cwd(), "src/components/community/community-create-space-flow.tsx"),
      "utf8",
    );
    const compact = readFileSync(
      resolve(process.cwd(), "src/components/community/community-create-space-compact-form.tsx"),
      "utf8",
    );

    expect(flow).toContain("useVisualViewportKeyboardInset");
    expect(flow).toContain("window.location.assign(path)");
    expect(flow).toContain("useMissionHubRefreshOptional");
    expect(flow).toContain("onCreated={finishSpaceCreated}");
    expect(compact).toContain("community/space-actions");
    expect(compact).toContain("mh-create-v3");
    expect(compact).toContain('role="alert"');
    expect(compact).toContain('role="status"');
    expect(compact).toContain("onCreated(res)");
    expect(compact).not.toContain("router.refresh");
  });

  it("uses keyboard-aware bottom sheet layout", () => {
    const sheet = readFileSync(
      resolve(process.cwd(), "src/components/community/community-bottom-sheet.tsx"),
      "utf8",
    );

    expect(sheet).toContain("safe-area-inset-top");
    expect(sheet).toContain("keyboardMaxHeight");
    expect(sheet).toContain("bodyRef");
    expect(sheet).toContain("guardDismissWhileKeyboard");
    expect(sheet).toContain("onFocusOutside");
  });

  it("mounts mobile sheet and desktop dialog exclusively for post composer", () => {
    const composer = readFileSync(
      resolve(process.cwd(), "src/components/community/community-create-post-composer.tsx"),
      "utf8",
    );

    expect(composer).toContain("useLgDesktop");
    expect(composer).toContain("!isDesktop");
    expect(composer).toContain("isDesktop ?");
    expect(composer).not.toContain("const form =");
    expect(composer).toContain("[mh-post-composer]");
  });

  it("loads published spaces in the community layout for live nav refresh", () => {
    const layout = readFileSync(
      resolve(process.cwd(), "src/app/(storefront)/community/layout.tsx"),
      "utf8",
    );

    expect(layout).toContain("listPublishedCommunitySpaces");
    expect(layout).toContain("CommunityPublishedSpacesProvider");
    expect(layout).toContain('export const dynamic = "force-dynamic"');
  });

  it("uses community route server action for mobile create", () => {
    const spaceActions = readFileSync(
      resolve(process.cwd(), "src/app/(storefront)/community/space-actions.ts"),
      "utf8",
    );
    const core = readFileSync(
      resolve(process.cwd(), "src/lib/community/create-community-space-core.ts"),
      "utf8",
    );

    expect(spaceActions).toContain('"use server"');
    expect(spaceActions).toContain("createCommunitySpaceCore");
    expect(spaceActions).toContain("ensureBlogArticlesSpaceAction");
    expect(spaceActions).not.toContain("export type { CreateCommunitySpaceResult }");
    expect(core).toContain('phase: "reached"');
    expect(core).toContain("requestId");
  });

  it("returns title and detailed validation errors from createCommunitySpaceAction", () => {
    const actions = readFileSync(
      resolve(process.cwd(), "src/lib/community/create-community-space-core.ts"),
      "utf8",
    );

    expect(actions).toContain("title: row.title");
    expect(actions).toContain("formatCommunitySpaceInputErrors");
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

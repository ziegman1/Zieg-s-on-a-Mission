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
    expect(layout).toContain("recordCommunityHubVisit");
  });

  it("preview includes engaged today and visit metrics", () => {
    const preview = readFileSync(
      resolve(process.cwd(), "src/lib/community/admin-members-preview.ts"),
      "utf8",
    );
    expect(preview).toContain("countEngagedMembersToday");
    expect(preview).toContain("countActiveMembersThisWeek");
    expect(preview).toContain("getHubVisitStatsToday");
    expect(preview).toContain("listRecentHubVisitors");
    expect(preview).toContain("engagedToday");
    expect(preview).toContain("visitsToday");
    expect(preview).toContain("uniqueMembersVisitedToday");
  });

  it("panel action loads full list on demand", () => {
    const actions = readFileSync(
      resolve(process.cwd(), "src/app/(storefront)/community/hub-admin-members-actions.ts"),
      "utf8",
    );
    expect(actions).toContain("listMembersForAdminPortal");
    expect(actions).toContain("requireCommunityOwner");
  });

  it("visit metrics are admin-only in the members cluster", () => {
    const cluster = readFileSync(
      resolve(process.cwd(), "src/components/community/community-topbar-members-cluster.tsx"),
      "utf8",
    );
    const panel = readFileSync(
      resolve(process.cwd(), "src/components/community/community-members-admin-panel.tsx"),
      "utf8",
    );

    expect(cluster).toMatch(/if \(!owner \|\| !hubPreview\) return null/);
    expect(panel).toContain("Visits today");
    expect(panel).toContain("Recent visitors");
    expect(panel).not.toContain("PageView");
  });
});

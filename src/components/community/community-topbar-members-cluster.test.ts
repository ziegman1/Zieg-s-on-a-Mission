import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("Mission Hub topbar members cluster", () => {
  it("admin sees avatar cluster left of the notification bell", () => {
    const topbar = readFileSync(
      resolve(process.cwd(), "src/components/community/community-topbar.tsx"),
      "utf8",
    );
    const cluster = readFileSync(
      resolve(process.cwd(), "src/components/community/community-topbar-members-cluster.tsx"),
      "utf8",
    );

    expect(cluster).toContain("MembersAvatarStack");
    expect(cluster).toContain("if (!owner || !hubPreview) return null");
    expect(cluster).toContain("loadHubMembersPanelAction");
    expect(cluster).toContain("CommunityBottomSheet");
    expect(cluster).toContain("CommunityMembersAdminPanel");

    const toolbar = topbar.slice(
      topbar.indexOf('<div className="flex items-center gap-0.5 shrink-0">'),
    );
    const clusterIdx = toolbar.indexOf("<CommunityTopbarMembersCluster");
    const bellIdx = toolbar.indexOf("<CommunityNotificationsBell");
    expect(clusterIdx).toBeGreaterThan(-1);
    expect(bellIdx).toBeGreaterThan(clusterIdx);
  });

  it("non-admin renders nothing without reserving space", () => {
    const cluster = readFileSync(
      resolve(process.cwd(), "src/components/community/community-topbar-members-cluster.tsx"),
      "utf8",
    );
    expect(cluster).toMatch(/if \(!owner \|\| !hubPreview\) return null/);
  });

  it("avatar stack uses compact overlap layout for mobile header", () => {
    const stack = readFileSync(
      resolve(process.cwd(), "src/components/community/members-avatar-stack.tsx"),
      "utf8",
    );
    expect(stack).toContain("-ml-2.5");
    expect(stack).toContain("!h-7 !w-7");
    expect(stack).toContain("ring-2 ring-white");
  });

  it("members panel includes search and stats", () => {
    const panel = readFileSync(
      resolve(process.cwd(), "src/components/community/community-members-admin-panel.tsx"),
      "utf8",
    );
    expect(panel).toContain("filterAdminMemberRows");
    expect(panel).toContain("Engaged today");
    expect(panel).toContain("Visits today");
    expect(panel).toContain("Active this week");
    expect(panel).not.toContain('label="Unread"');
    expect(panel).toContain('type="search"');
  });
});

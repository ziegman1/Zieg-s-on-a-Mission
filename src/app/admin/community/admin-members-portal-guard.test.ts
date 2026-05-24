import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("admin members portal guards", () => {
  it("community admin nav includes Members tab", () => {
    const nav = readFileSync(
      resolve(process.cwd(), "src/app/admin/community/community-admin-nav.tsx"),
      "utf8",
    );
    expect(nav).toContain('href: "/admin/community/members"');
    expect(nav).toContain('label: "Members"');
  });

  it("community dashboard links to members with count", () => {
    const dashboard = readFileSync(
      resolve(process.cwd(), "src/app/admin/community/community-admin-dashboard.tsx"),
      "utf8",
    );
    expect(dashboard).toContain("/admin/community/members");
    expect(dashboard).toContain("memberCount");
  });

  it("member actions require community owner", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/admin/community/member-actions.ts"),
      "utf8",
    );
    expect(source).toContain("requireCommunityOwner");
    expect(source).toContain("getAdminMemberDetailAction");
    expect(source).toContain("logAdminMemberAudit");
  });

  it("members page uses portal list loader and auth diagnostics", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/app/admin/community/members/page.tsx"),
      "utf8",
    );
    expect(page).toContain("listMembersForAdminPortal");
    expect(page).toContain("AdminMembersPortal");
    expect(page).toContain('dynamic = "force-dynamic"');
    expect(page).toContain("getCurrentCommunityOwner");
    expect(page).toContain("[admin/members]");
  });

  it("portal component renders filters and detail", () => {
    const ui = readFileSync(
      resolve(process.cwd(), "src/components/community/admin-members-portal.tsx"),
      "utf8",
    );
    expect(ui).toContain("filterAdminMemberRows");
    expect(ui).toContain("getAdminMemberDetailAction");
    expect(ui).toContain("read-only");
  });
});

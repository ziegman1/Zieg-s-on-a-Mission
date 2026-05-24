import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("admin community stats", () => {
  it("admin dashboard links to members portal", () => {
    const page = readFileSync(resolve(process.cwd(), "src/app/admin/page.tsx"), "utf8");
    expect(page).toContain("/admin/community/members");
    expect(page).toContain("getCommunityAdminStats");
  });
});

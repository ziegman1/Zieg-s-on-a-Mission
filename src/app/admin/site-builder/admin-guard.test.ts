import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

/**
 * Lightweight guard checks — server actions use requireAdminSession at runtime.
 */
describe("admin site builder guard", () => {
  it("site builder actions require admin session", () => {
    const actionsPath = resolve(
      process.cwd(),
      "src/app/admin/site-builder/actions.ts",
    );
    const blogActionsPath = resolve(
      process.cwd(),
      "src/app/admin/site-builder/blog-actions.ts",
    );
    const newsletterActionsPath = resolve(
      process.cwd(),
      "src/app/admin/site-builder/newsletter-actions.ts",
    );
    const actions = readFileSync(actionsPath, "utf8");
    const blogActions = readFileSync(blogActionsPath, "utf8");
    const newsletterActions = readFileSync(newsletterActionsPath, "utf8");

    expect(actions).toContain("requireAdminSession");
    expect(blogActions).toContain("requireAdminSession");
    expect(newsletterActions).toContain("requireAdminSession");
    expect(actions).toMatch(/saveBuilderPageAction[\s\S]*requireAdminSession/);
  });

  it("admin site builder page is force-dynamic", () => {
    const pagePath = resolve(process.cwd(), "src/app/admin/site-builder/page.tsx");
    const source = readFileSync(pagePath, "utf8");
    expect(source).toContain('export const dynamic = "force-dynamic"');
  });
});

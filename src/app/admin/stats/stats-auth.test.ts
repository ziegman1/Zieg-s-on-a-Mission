import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("admin stats authorization", () => {
  it("remains under admin layout session gate", () => {
    const layout = readFileSync(resolve(process.cwd(), "src/app/admin/layout.tsx"), "utf8");
    expect(layout).toContain("safeAuth");
    expect(layout).toContain('role === "ADMIN"');
    expect(layout).toContain("/admin/stats");
  });

  it("does not expose a public analytics records API", () => {
    const track = readFileSync(resolve(process.cwd(), "src/app/api/track/route.ts"), "utf8");
    expect(track).not.toMatch(/export async function GET/);
  });
});

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("retention / cascade safety", () => {
  it("PageView has no FK cascade from analytics_sessions", () => {
    const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
    const pageViewBlock = schema.slice(
      schema.indexOf("model PageView"),
      schema.indexOf("model AnalyticsSession"),
    );
    expect(pageViewBlock).toContain("sessionId");
    expect(pageViewBlock).not.toContain("AnalyticsSession");
    expect(pageViewBlock).not.toContain("onDelete");
  });

  it("analytics_events cascade from sessions only", () => {
    const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
    expect(schema).toMatch(
      /session AnalyticsSession @relation\(fields: \[sessionId\], references: \[id\], onDelete: Cascade\)/,
    );
  });

  it("cleanup script preserves PageViews by default and dry-run never deletes", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/cleanup-analytics.ts"), "utf8");
    expect(script).toContain("--dry-run");
    expect(script).toContain("Dry run — no deletes.");
    expect(script).toContain("--include-page-views");
    expect(script).toContain("Skipped PageView deletion.");
    expect(script).toMatch(/if \(dryRun\) \{[\s\S]*return;/);
    expect(script).toMatch(/if \(includePageViews\) \{[\s\S]*pageView\.deleteMany/);
  });

  it("does not delete Mission Hub activity rows", () => {
    const script = readFileSync(resolve(process.cwd(), "scripts/cleanup-analytics.ts"), "utf8");
    expect(script).not.toContain("communityHubActivityEvent");
    expect(script).not.toMatch(/deleteMany\([\s\S]*community_hub/);
    expect(script).toContain("Does NOT touch Mission Hub");
  });
});

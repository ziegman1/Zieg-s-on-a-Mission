import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("Traffic & Stats engagement-disabled notice", () => {
  it("shows a clear notice when engagement flag is off", () => {
    const page = readFileSync(resolve(process.cwd(), "src/app/admin/stats/page.tsx"), "utf8");
    expect(page).toContain("isAnalyticsEngagementEnabled");
    expect(page).toContain("Engagement tracking is off");
    expect(page).toContain("Likely Human");
    expect(page).toContain("NEXT_PUBLIC_ANALYTICS_ENGAGEMENT_ENABLED");
  });

  it("lists All Traffic first and documents it as the default", () => {
    const page = readFileSync(resolve(process.cwd(), "src/app/admin/stats/page.tsx"), "utf8");
    const allIdx = page.indexOf('{ id: "all", label: "All Traffic" }');
    const humanIdx = page.indexOf('{ id: "likely_human", label: "Likely Human" }');
    expect(allIdx).toBeGreaterThan(-1);
    expect(humanIdx).toBeGreaterThan(allIdx);
    expect(page).toContain("Default filter is");
    expect(page).toContain("All Traffic");
  });
});

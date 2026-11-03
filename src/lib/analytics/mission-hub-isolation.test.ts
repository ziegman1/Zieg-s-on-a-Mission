import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("Mission Hub isolation", () => {
  it("does not alter hub-activity-events recording from analytics ingest", () => {
    const ingest = readFileSync(resolve(process.cwd(), "src/lib/analytics/ingest.ts"), "utf8");
    expect(ingest).not.toContain("recordCommunityHubVisit");
    expect(ingest).not.toContain("communityHubActivityEvent");
  });

  it("keeps hub visit helper free of storefront analytics tables", () => {
    const hub = readFileSync(
      resolve(process.cwd(), "src/lib/community/hub-activity-events.ts"),
      "utf8",
    );
    expect(hub).not.toContain("analytics_sessions");
    expect(hub).not.toContain("AnalyticsEvent");
    expect(hub).not.toContain("pageView");
  });
});

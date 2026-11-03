import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("client DNT and page_view consistency", () => {
  it("skips engagement/CTA under DNT but still allows page_view", () => {
    const client = readFileSync(resolve(process.cwd(), "src/lib/analytics/client.ts"), "utf8");
    expect(client).toContain("doNotTrack");
    expect(client).toContain('type !== "page_view"');
  });

  it("requires explicit env enablement for engagement/CTA", () => {
    const client = readFileSync(resolve(process.cwd(), "src/lib/analytics/client.ts"), "utf8");
    expect(client).toContain("NEXT_PUBLIC_ANALYTICS_ENGAGEMENT_ENABLED");
    expect(client).toContain("isAnalyticsEngagementEnabled");
  });

  it("tracks SPA pathname changes with client + server dedupe windows", () => {
    const tracker = readFileSync(
      resolve(process.cwd(), "src/components/page-view-tracker.tsx"),
      "utf8",
    );
    expect(tracker).toContain("usePathname");
    expect(tracker).toContain("trackPageView");
    const client = readFileSync(resolve(process.cwd(), "src/lib/analytics/client.ts"), "utf8");
    expect(client).toContain("2000");
    const ingest = readFileSync(resolve(process.cwd(), "src/lib/analytics/ingest.ts"), "utf8");
    expect(ingest).toContain("PAGE_VIEW_DEDUPE_MS");
    expect(ingest).toContain("do not also insert analytics_events type=page_view");
  });
});

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

describe("privacy / consent posture for first-party engagement", () => {
  it("privacy policy discloses engagement, CTA, session storage, DNT, and regional choice", () => {
    const privacy = readFileSync(
      resolve(process.cwd(), "src/app/(storefront)/privacy/page.tsx"),
      "utf8",
    );
    expect(privacy).toContain("coarse engagement signals");
    expect(privacy).toContain("scroll depth");
    expect(privacy).toContain("allowlisted ministry CTA");
    expect(privacy).toContain("session storage");
    expect(privacy).toContain("Do Not Track");
    expect(privacy).toContain("Regional analytics choice");
    expect(privacy).toContain("EEA or United Kingdom");
    expect(privacy).toContain("Analytics preferences");
  });

  it("legal-config documents Option B regional gate and engagement flag", () => {
    const legal = readFileSync(resolve(process.cwd(), "src/data/legal-config.ts"), "utf8");
    expect(legal).toContain("NEXT_PUBLIC_ANALYTICS_ENGAGEMENT_ENABLED");
    expect(legal).toContain("consent required");
    expect(legal).toContain("sessionStorage");
    expect(legal).toContain("x-vercel-ip-country");
    expect(legal).toContain("zoam_analytics_consent");
  });

  it("client gates engagement/CTA on flag and DNT; page_view remains independent when allowed", () => {
    const client = readFileSync(resolve(process.cwd(), "src/lib/analytics/client.ts"), "utf8");
    const flag = readFileSync(
      resolve(process.cwd(), "src/lib/analytics/engagement-flag.ts"),
      "utf8",
    );
    expect(flag).toContain("NEXT_PUBLIC_ANALYTICS_ENGAGEMENT_ENABLED");
    expect(client).toContain("isAnalyticsEngagementEnabled");
    expect(client).toContain("doNotTrack");
    expect(client).toContain('type !== "page_view"');
    expect(client).toContain("isAnalyticsCollectionAllowed");
  });

  it("storefront wires consent banner and preferences control", () => {
    const layout = readFileSync(
      resolve(process.cwd(), "src/app/(storefront)/layout.tsx"),
      "utf8",
    );
    expect(layout).toContain("AnalyticsPrivacyProvider");
    expect(layout).toContain("AnalyticsConsentBanner");
    expect(layout).toContain("AnalyticsPreferencesButton");
  });
});

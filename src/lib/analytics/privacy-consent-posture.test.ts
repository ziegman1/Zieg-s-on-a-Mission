import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

/**
 * Documents the disclosure-only consent posture. Enabling engagement in production
 * requires an explicit owner decision — there is still no consent banner.
 */
describe("privacy / consent posture for first-party engagement", () => {
  it("privacy policy discloses engagement, CTA, session storage, and DNT skip", () => {
    const privacy = readFileSync(
      resolve(process.cwd(), "src/app/(storefront)/privacy/page.tsx"),
      "utf8",
    );
    expect(privacy).toContain("coarse engagement signals");
    expect(privacy).toContain("scroll depth");
    expect(privacy).toContain("allowlisted ministry CTA");
    expect(privacy).toContain("session storage");
    expect(privacy).toContain("Do Not Track");
    expect(privacy).toContain("skip engagement and CTA");
    expect(privacy).not.toContain("consent banner");
  });

  it("legal-config requires owner consent posture before production enablement", () => {
    const legal = readFileSync(resolve(process.cwd(), "src/data/legal-config.ts"), "utf8");
    expect(legal).toContain("NEXT_PUBLIC_ANALYTICS_ENGAGEMENT_ENABLED");
    expect(legal).toContain("No consent banner exists");
    expect(legal).toContain("Do not enable engagement in production");
    expect(legal.toLowerCase()).toContain("disclosure-only");
    expect(legal).toContain("sessionStorage");
    expect(legal).toContain("ePrivacy");
  });

  it("client gates engagement/CTA on flag and DNT; page_view remains independent", () => {
    const client = readFileSync(resolve(process.cwd(), "src/lib/analytics/client.ts"), "utf8");
    const flag = readFileSync(
      resolve(process.cwd(), "src/lib/analytics/engagement-flag.ts"),
      "utf8",
    );
    expect(flag).toContain("NEXT_PUBLIC_ANALYTICS_ENGAGEMENT_ENABLED");
    expect(client).toContain("isAnalyticsEngagementEnabled");
    expect(client).toContain("doNotTrack");
    expect(client).toContain('type !== "page_view"');
  });
});

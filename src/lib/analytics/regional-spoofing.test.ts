import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { decideAnalyticsPrivacy } from "./consent";

describe("regional spoofing protections", () => {
  it("client country on a track-like payload cannot open a consent_required region", () => {
    // Simulate what ingest uses: headers + cookie only. Body.country is never passed in.
    const decision = decideAnalyticsPrivacy({
      headers: new Headers({ "x-vercel-ip-country": "DE" }),
      consentCookie: undefined,
      geoOptions: { vercelEnv: "1", override: null },
    });
    expect(decision.collectionAllowed).toBe(false);
    // Spoofed US in a parallel world — still blocked without consent cookie.
    expect(decision.countryCode).toBe("DE");
  });

  it("privacy API route ignores client country/region fields", () => {
    const route = readFileSync(
      resolve(process.cwd(), "src/app/api/analytics-privacy/route.ts"),
      "utf8",
    );
    expect(route).toContain("void body.country");
    expect(route).toContain("void body.region");
    expect(route).toContain("decideAnalyticsPrivacy");
  });

  it("ingest documents ignoring client country", () => {
    const ingest = readFileSync(resolve(process.cwd(), "src/lib/analytics/ingest.ts"), "utf8");
    expect(ingest).toContain("void payload.country");
    expect(ingest).toContain("decideAnalyticsPrivacy");
  });
});

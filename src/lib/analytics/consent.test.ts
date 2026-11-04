import { describe, expect, it } from "vitest";
import {
  decideAnalyticsPrivacy,
  parseAnalyticsConsentCookie,
} from "./consent";

describe("parseAnalyticsConsentCookie", () => {
  it("parses granted, denied, and unset", () => {
    expect(parseAnalyticsConsentCookie("granted")).toBe("granted");
    expect(parseAnalyticsConsentCookie("denied")).toBe("denied");
    expect(parseAnalyticsConsentCookie(undefined)).toBe("unset");
    expect(parseAnalyticsConsentCookie("maybe")).toBe("unset");
  });
});

describe("decideAnalyticsPrivacy", () => {
  it("allows US collection without consent cookie", () => {
    const decision = decideAnalyticsPrivacy({
      headers: new Headers({ "x-vercel-ip-country": "US" }),
      consentCookie: undefined,
      geoOptions: { vercelEnv: "1", override: null },
    });
    expect(decision.regionMode).toBe("open");
    expect(decision.collectionAllowed).toBe(true);
  });

  it("blocks EEA until opt-in; allows after grant; blocks after decline", () => {
    const headers = new Headers({ "x-vercel-ip-country": "DE" });
    const unset = decideAnalyticsPrivacy({
      headers,
      consentCookie: undefined,
      geoOptions: { vercelEnv: "1", override: null },
    });
    expect(unset.regionMode).toBe("consent_required");
    expect(unset.collectionAllowed).toBe(false);

    const granted = decideAnalyticsPrivacy({
      headers,
      consentCookie: "granted",
      geoOptions: { vercelEnv: "1", override: null },
    });
    expect(granted.collectionAllowed).toBe(true);

    const denied = decideAnalyticsPrivacy({
      headers,
      consentCookie: "denied",
      geoOptions: { vercelEnv: "1", override: null },
    });
    expect(denied.collectionAllowed).toBe(false);
  });

  it("treats unknown geography as consent_required even if client would claim US", () => {
    // Not on Vercel: header ignored → unknown → protective.
    const decision = decideAnalyticsPrivacy({
      headers: new Headers({ "x-vercel-ip-country": "US" }),
      consentCookie: undefined,
      geoOptions: { vercelEnv: undefined, override: null },
    });
    expect(decision.regionMode).toBe("consent_required");
    expect(decision.collectionAllowed).toBe(false);
    expect(decision.countryCode).toBe(null);
  });

  it("does not use body-like headers for country (only x-vercel-ip-country on Vercel)", () => {
    const headers = new Headers({
      "x-vercel-ip-country": "FR",
      "x-user-country": "US",
      "cf-ipcountry": "US",
    });
    const decision = decideAnalyticsPrivacy({
      headers,
      consentCookie: "granted",
      geoOptions: { vercelEnv: "1", override: null },
    });
    expect(decision.countryCode).toBe("FR");
    expect(decision.regionMode).toBe("consent_required");
  });
});

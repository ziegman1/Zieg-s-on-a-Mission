import { describe, expect, it } from "vitest";
import {
  classifyAnalyticsRegionMode,
  resolveRequestCountryCode,
} from "./geo";

describe("classifyAnalyticsRegionMode", () => {
  it("requires consent for EEA/UK", () => {
    expect(classifyAnalyticsRegionMode("DE")).toBe("consent_required");
    expect(classifyAnalyticsRegionMode("FR")).toBe("consent_required");
    expect(classifyAnalyticsRegionMode("GB")).toBe("consent_required");
    expect(classifyAnalyticsRegionMode("NO")).toBe("consent_required");
  });

  it("requires consent when geography is unknown", () => {
    expect(classifyAnalyticsRegionMode(null)).toBe("consent_required");
    expect(classifyAnalyticsRegionMode(undefined)).toBe("consent_required");
    expect(classifyAnalyticsRegionMode("")).toBe("consent_required");
  });

  it("allows open disclosure-only mode for US and other non-EEA known countries", () => {
    expect(classifyAnalyticsRegionMode("US")).toBe("open");
    expect(classifyAnalyticsRegionMode("CA")).toBe("open");
    expect(classifyAnalyticsRegionMode("AU")).toBe("open");
  });
});

describe("resolveRequestCountryCode", () => {
  it("ignores x-vercel-ip-country when not on Vercel (spoofing / local)", () => {
    const headers = new Headers({ "x-vercel-ip-country": "US" });
    expect(resolveRequestCountryCode(headers, { vercelEnv: undefined, override: null })).toBe(
      null,
    );
    expect(resolveRequestCountryCode(headers, { vercelEnv: "0", override: null })).toBe(null);
  });

  it("trusts x-vercel-ip-country only when VERCEL=1", () => {
    const headers = new Headers({ "x-vercel-ip-country": "de" });
    expect(resolveRequestCountryCode(headers, { vercelEnv: "1", override: null })).toBe("DE");
  });

  it("prefers server-only override over headers (local tests)", () => {
    const headers = new Headers({ "x-vercel-ip-country": "US" });
    expect(
      resolveRequestCountryCode(headers, { vercelEnv: "1", override: "GB" }),
    ).toBe("GB");
  });

  it("rejects malformed country codes", () => {
    const headers = new Headers({ "x-vercel-ip-country": "USA" });
    expect(resolveRequestCountryCode(headers, { vercelEnv: "1", override: null })).toBe(null);
  });
});

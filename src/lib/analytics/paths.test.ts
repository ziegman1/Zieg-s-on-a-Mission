import { describe, expect, it } from "vitest";
import { isMinistryFunnelPath, normalizeAnalyticsPath } from "./paths";

describe("normalizeAnalyticsPath", () => {
  it("accepts first-party paths and strips query/hash", () => {
    expect(normalizeAnalyticsPath("/our-mission?x=1#y")).toBe("/our-mission");
    expect(normalizeAnalyticsPath("https://ziegsonamission.com/partner")).toBe("/partner");
  });

  it("rejects admin, api, and untrusted values", () => {
    expect(normalizeAnalyticsPath("/admin/stats")).toBeNull();
    expect(normalizeAnalyticsPath("/api/track")).toBeNull();
    expect(normalizeAnalyticsPath("//evil.com")).toBeNull();
    expect(normalizeAnalyticsPath("javascript:alert(1)")).toBeNull();
  });
});

describe("isMinistryFunnelPath", () => {
  it("flags our mission and giving pages", () => {
    expect(isMinistryFunnelPath("/our-mission").ourMission).toBe(true);
    expect(isMinistryFunnelPath("/ministry-funding").givingPage).toBe(true);
    expect(isMinistryFunnelPath("/shop").givingPage).toBe(false);
  });
});

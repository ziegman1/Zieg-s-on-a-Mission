import { describe, expect, it } from "vitest";
import { isAnalyticsEngagementEnabled } from "./engagement-flag";

describe("isAnalyticsEngagementEnabled", () => {
  it("is off when unset, empty, or unknown", () => {
    expect(isAnalyticsEngagementEnabled(undefined)).toBe(false);
    expect(isAnalyticsEngagementEnabled(null)).toBe(false);
    expect(isAnalyticsEngagementEnabled("")).toBe(false);
    expect(isAnalyticsEngagementEnabled("0")).toBe(false);
    expect(isAnalyticsEngagementEnabled("false")).toBe(false);
    expect(isAnalyticsEngagementEnabled("yes")).toBe(false);
  });

  it("is on only for explicit true/1", () => {
    expect(isAnalyticsEngagementEnabled("true")).toBe(true);
    expect(isAnalyticsEngagementEnabled("1")).toBe(true);
  });
});

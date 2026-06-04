import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/community/settings-types";
import { isWeeklyDigestEmailEligible } from "@/lib/mission-hub/weekly-digest-recipients";

describe("isWeeklyDigestEmailEligible", () => {
  it("requires email channel and weeklyDigest enabled", () => {
    expect(isWeeklyDigestEmailEligible(DEFAULT_NOTIFICATION_PREFERENCES, "a@example.com")).toBe(
      true,
    );
    expect(
      isWeeklyDigestEmailEligible(
        { ...DEFAULT_NOTIFICATION_PREFERENCES, weeklyDigest: false },
        "a@example.com",
      ),
    ).toBe(false);
    expect(
      isWeeklyDigestEmailEligible(
        { ...DEFAULT_NOTIFICATION_PREFERENCES, email: false },
        "a@example.com",
      ),
    ).toBe(false);
  });

  it("requires a valid email address", () => {
    expect(isWeeklyDigestEmailEligible(DEFAULT_NOTIFICATION_PREFERENCES, "")).toBe(false);
    expect(isWeeklyDigestEmailEligible(DEFAULT_NOTIFICATION_PREFERENCES, null)).toBe(false);
  });
});

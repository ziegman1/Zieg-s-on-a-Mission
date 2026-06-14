import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/community/settings-types";
import {
  diffNotificationPreferenceEvents,
  weeklyDigestEligible,
} from "@/lib/mission-hub/notification-preference-event-diff";

describe("notification-preference-event-diff", () => {
  it("detects email channel toggle", () => {
    const events = diffNotificationPreferenceEvents(
      { ...DEFAULT_NOTIFICATION_PREFERENCES, email: true },
      { ...DEFAULT_NOTIFICATION_PREFERENCES, email: false },
    );
    expect(events).toContain("email_channel_disabled");
    expect(events).toContain("weekly_digest_disabled");
  });

  it("detects weekly digest toggle via legacy flag", () => {
    expect(
      diffNotificationPreferenceEvents(
        { ...DEFAULT_NOTIFICATION_PREFERENCES, weeklyDigest: true },
        { ...DEFAULT_NOTIFICATION_PREFERENCES, weeklyDigest: false },
      ),
    ).toContain("weekly_digest_disabled");
  });

  it("detects category frequency changes", () => {
    const events = diffNotificationPreferenceEvents(DEFAULT_NOTIFICATION_PREFERENCES, {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      categoryFrequencies: {
        ...DEFAULT_NOTIFICATION_PREFERENCES.categoryFrequencies,
        newsletters: "weekly_digest",
      },
    });
    expect(events).toContain("category_frequency_changed");
  });

  it("returns empty array when nothing changed", () => {
    expect(diffNotificationPreferenceEvents(DEFAULT_NOTIFICATION_PREFERENCES, DEFAULT_NOTIFICATION_PREFERENCES)).toEqual([]);
  });

  it("reports weekly digest eligibility from prefs", () => {
    expect(weeklyDigestEligible(DEFAULT_NOTIFICATION_PREFERENCES)).toBe(true);
    expect(
      weeklyDigestEligible({
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        email: false,
      }),
    ).toBe(false);
  });
});

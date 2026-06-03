import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/community/settings-types";
import { evaluateUrgentPrayerNotificationEligibility } from "./urgent-prayer-notification-preferences";

describe("evaluateUrgentPrayerNotificationEligibility", () => {
  const spaceId = "space-prayer";

  it("allows email when prayerResponses is on", () => {
    const result = evaluateUrgentPrayerNotificationEligibility(
      { ...DEFAULT_NOTIFICATION_PREFERENCES, newPosts: false, prayerResponses: true },
      { spaceId },
    );
    expect(result.emailChannel).toBe(true);
    expect(result.inAppChannel).toBe(true);
  });

  it("allows email when newPosts is on even if prayerResponses is off", () => {
    const result = evaluateUrgentPrayerNotificationEligibility(
      { ...DEFAULT_NOTIFICATION_PREFERENCES, prayerResponses: false, newPosts: true },
      { spaceId },
    );
    expect(result.emailChannel).toBe(true);
  });

  it("blocks muted Prayer Room users", () => {
    const result = evaluateUrgentPrayerNotificationEligibility(
      { ...DEFAULT_NOTIFICATION_PREFERENCES, mutedSpaceIds: [spaceId] },
      { spaceId },
    );
    expect(result.emailChannel).toBe(false);
    expect(result.skipReason).toBe("space_muted");
  });

  it("blocks when both prayerResponses and newPosts are off", () => {
    const result = evaluateUrgentPrayerNotificationEligibility(
      { ...DEFAULT_NOTIFICATION_PREFERENCES, prayerResponses: false, newPosts: false },
      { spaceId },
    );
    expect(result.emailChannel).toBe(false);
    expect(result.skipReason).toBe("prayer_and_new_posts_disabled");
  });

  it("blocks email channel when global email pref is off but in-app may still deliver", () => {
    const result = evaluateUrgentPrayerNotificationEligibility(
      { ...DEFAULT_NOTIFICATION_PREFERENCES, email: false },
      { spaceId },
    );
    expect(result.emailChannel).toBe(false);
    expect(result.inAppChannel).toBe(true);
    expect(result.skipReason).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
} from "@/lib/community/settings-types";
import {
  evaluateNewsletterNotificationEligibility,
  memberWantsWeeklyDigest,
  toggleMutedSpace,
} from "./notification-preferences";

describe("default notification preferences", () => {
  it("enables ministry updates, newsletters, weekly digest, email, and in-app by default", () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.ministryUpdates).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.newsletters).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.weeklyDigest).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.email).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.inApp).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.push).toBe(false);
    expect(DEFAULT_NOTIFICATION_PREFERENCES.mutedSpaceIds).toEqual([]);
  });

  it("merges stored JSON with new fields", () => {
    const merged = mergeNotificationPreferences({
      newPosts: false,
      email: false,
    });
    expect(merged.newPosts).toBe(false);
    expect(merged.email).toBe(false);
    expect(merged.newsletters).toBe(true);
    expect(merged.weeklyDigest).toBe(true);
  });
});

describe("evaluateNewsletterNotificationEligibility", () => {
  it("excludes user when newsletters are disabled", () => {
    const e = evaluateNewsletterNotificationEligibility({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      newsletters: false,
    });
    expect(e.wantsNewsletterContent).toBe(false);
    expect(e.emailChannel).toBe(false);
    expect(e.inAppChannel).toBe(false);
    expect(e.skipReason).toBe("newsletters_disabled");
  });

  it("excludes email channel only when email is disabled", () => {
    const e = evaluateNewsletterNotificationEligibility({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      email: false,
    });
    expect(e.wantsNewsletterContent).toBe(true);
    expect(e.emailChannel).toBe(false);
    expect(e.inAppChannel).toBe(true);
  });

  it("excludes all channels when announcement space is muted", () => {
    const e = evaluateNewsletterNotificationEligibility(
      toggleMutedSpace(DEFAULT_NOTIFICATION_PREFERENCES, "space-1", true),
      { announcementSpaceId: "space-1" },
    );
    expect(e.spaceMuted).toBe(true);
    expect(e.emailChannel).toBe(false);
    expect(e.skipReason).toBe("space_muted");
  });
});

describe("memberWantsWeeklyDigest", () => {
  it("requires weekly digest and email", () => {
    expect(memberWantsWeeklyDigest(DEFAULT_NOTIFICATION_PREFERENCES)).toBe(true);
    expect(
      memberWantsWeeklyDigest({ ...DEFAULT_NOTIFICATION_PREFERENCES, weeklyDigest: false }),
    ).toBe(false);
    expect(memberWantsWeeklyDigest({ ...DEFAULT_NOTIFICATION_PREFERENCES, email: false })).toBe(
      false,
    );
  });
});

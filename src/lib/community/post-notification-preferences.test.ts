import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/community/settings-types";
import { evaluatePostPublishNotificationEligibility } from "./post-notification-preferences";

describe("evaluatePostPublishNotificationEligibility", () => {
  const base = { spaceId: "space-1" };

  it("enables channels when mapped preference and channels are on (custom → newPosts)", () => {
    const result = evaluatePostPublishNotificationEligibility(
      DEFAULT_NOTIFICATION_PREFERENCES,
      { ...base, notificationCategory: "custom" },
    );
    expect(result.preferenceKey).toBe("newPosts");
    expect(result.emailChannel).toBe(true);
    expect(result.inAppChannel).toBe(true);
    expect(result.skipReason).toBeNull();
  });

  it("ministry_updates respects ministryUpdates, not newPosts alone", () => {
    const enabled = evaluatePostPublishNotificationEligibility(
      {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        newPosts: true,
        ministryUpdates: true,
      },
      { ...base, notificationCategory: "ministry_updates" },
    );
    expect(enabled.preferenceKey).toBe("ministryUpdates");
    expect(enabled.emailChannel).toBe(true);

    const disabled = evaluatePostPublishNotificationEligibility(
      {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        newPosts: true,
        ministryUpdates: false,
      },
      { ...base, notificationCategory: "ministry_updates" },
    );
    expect(disabled.emailChannel).toBe(false);
    expect(disabled.inAppChannel).toBe(false);
    expect(disabled.skipReason).toBe("ministry_updates_disabled");
  });

  it("newsletters category respects newsletters preference", () => {
    const disabled = evaluatePostPublishNotificationEligibility(
      {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        newPosts: true,
        newsletters: false,
      },
      { ...base, notificationCategory: "newsletters" },
    );
    expect(disabled.preferenceKey).toBe("newsletters");
    expect(disabled.skipReason).toBe("newsletters_disabled");
  });

  it("prayer_requests respects prayerResponses", () => {
    const disabled = evaluatePostPublishNotificationEligibility(
      {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        newPosts: true,
        prayerResponses: false,
      },
      { ...base, notificationCategory: "prayer_requests" },
    );
    expect(disabled.preferenceKey).toBe("prayerResponses");
    expect(disabled.skipReason).toBe("prayer_responses_disabled");
  });

  it("praise_reports respects praiseReports", () => {
    const disabled = evaluatePostPublishNotificationEligibility(
      {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        newPosts: true,
        praiseReports: false,
      },
      { ...base, notificationCategory: "praise_reports" },
    );
    expect(disabled.preferenceKey).toBe("praiseReports");
    expect(disabled.skipReason).toBe("praise_reports_disabled");
  });

  it("blog_articles falls back to newPosts", () => {
    const disabled = evaluatePostPublishNotificationEligibility(
      {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        newPosts: false,
        ministryUpdates: true,
      },
      { ...base, notificationCategory: "blog_articles" },
    );
    expect(disabled.preferenceKey).toBe("newPosts");
    expect(disabled.skipReason).toBe("new_posts_disabled");

    const enabled = evaluatePostPublishNotificationEligibility(
      {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        newPosts: true,
        ministryUpdates: false,
      },
      { ...base, notificationCategory: "blog_articles" },
    );
    expect(enabled.emailChannel).toBe(true);
  });

  it("resources falls back to newPosts", () => {
    const result = evaluatePostPublishNotificationEligibility(
      { ...DEFAULT_NOTIFICATION_PREFERENCES, newPosts: false },
      { ...base, notificationCategory: "resources" },
    );
    expect(result.preferenceKey).toBe("newPosts");
    expect(result.skipReason).toBe("new_posts_disabled");
  });

  it("mutedSpaceIds blocks notification", () => {
    const result = evaluatePostPublishNotificationEligibility(
      {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        mutedSpaceIds: ["space-1"],
      },
      { ...base, notificationCategory: "ministry_updates" },
    );
    expect(result.spaceMuted).toBe(true);
    expect(result.emailChannel).toBe(false);
    expect(result.inAppChannel).toBe(false);
    expect(result.skipReason).toBe("space_muted");
  });

  it("email channel off blocks email but not in-app when preference is on", () => {
    const result = evaluatePostPublishNotificationEligibility(
      {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        email: false,
        inApp: true,
      },
      { ...base, notificationCategory: "ministry_updates" },
    );
    expect(result.emailChannel).toBe(false);
    expect(result.inAppChannel).toBe(true);
    expect(result.skipReason).toBeNull();
  });

  it("inApp channel off blocks in-app but not email when preference is on", () => {
    const result = evaluatePostPublishNotificationEligibility(
      {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        email: true,
        inApp: false,
      },
      { ...base, notificationCategory: "ministry_updates" },
    );
    expect(result.emailChannel).toBe(true);
    expect(result.inAppChannel).toBe(false);
    expect(result.skipReason).toBeNull();
  });

  it("both channels off yields all_channels_off when preference is on", () => {
    const result = evaluatePostPublishNotificationEligibility(
      {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        email: false,
        inApp: false,
      },
      base,
    );
    expect(result.skipReason).toBe("all_channels_off");
  });

  it("defaults to custom/newPosts when category omitted", () => {
    const result = evaluatePostPublishNotificationEligibility(
      { ...DEFAULT_NOTIFICATION_PREFERENCES, newPosts: false },
      base,
    );
    expect(result.preferenceKey).toBe("newPosts");
    expect(result.skipReason).toBe("new_posts_disabled");
  });
});

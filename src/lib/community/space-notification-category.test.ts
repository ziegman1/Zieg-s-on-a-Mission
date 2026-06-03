import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/community/settings-types";
import {
  memberWantsCategoryNotification,
  notificationPreferenceKeyForCategory,
} from "./space-notification-category";

describe("space notification category mapping", () => {
  it("maps categories to the expected user preference keys", () => {
    expect(notificationPreferenceKeyForCategory("ministry_updates")).toBe("ministryUpdates");
    expect(notificationPreferenceKeyForCategory("newsletters")).toBe("newsletters");
    expect(notificationPreferenceKeyForCategory("prayer_requests")).toBe("prayerResponses");
    expect(notificationPreferenceKeyForCategory("praise_reports")).toBe("praiseReports");
    expect(notificationPreferenceKeyForCategory("blog_articles")).toBe("newPosts");
    expect(notificationPreferenceKeyForCategory("resources")).toBe("newPosts");
    expect(notificationPreferenceKeyForCategory("custom")).toBe("newPosts");
  });

  it("memberWantsCategoryNotification respects the mapped preference", () => {
    expect(
      memberWantsCategoryNotification(
        { ...DEFAULT_NOTIFICATION_PREFERENCES, ministryUpdates: false },
        "ministry_updates",
      ),
    ).toBe(false);
    expect(
      memberWantsCategoryNotification(
        { ...DEFAULT_NOTIFICATION_PREFERENCES, newPosts: false, ministryUpdates: true },
        "ministry_updates",
      ),
    ).toBe(true);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  advancedNotificationExcludeFilter,
  isAdvancedNotificationType,
  isMissionHubAdvancedNotificationsEnabled,
  shouldIncludeAdvancedNotificationType,
} from "./advanced-notifications-config";

describe("advanced notifications feature flag", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is disabled unless MISSION_HUB_ADVANCED_NOTIFICATIONS_ENABLED=true", () => {
    vi.stubEnv("MISSION_HUB_ADVANCED_NOTIFICATIONS_ENABLED", "");
    expect(isMissionHubAdvancedNotificationsEnabled()).toBe(false);
    vi.stubEnv("MISSION_HUB_ADVANCED_NOTIFICATIONS_ENABLED", "false");
    expect(isMissionHubAdvancedNotificationsEnabled()).toBe(false);
    vi.stubEnv("MISSION_HUB_ADVANCED_NOTIFICATIONS_ENABLED", "true");
    expect(isMissionHubAdvancedNotificationsEnabled()).toBe(true);
  });

  it("hides advanced notification types when disabled", () => {
    vi.stubEnv("MISSION_HUB_ADVANCED_NOTIFICATIONS_ENABLED", "false");
    expect(isAdvancedNotificationType("blog_published")).toBe(true);
    expect(shouldIncludeAdvancedNotificationType("blog_published")).toBe(false);
    expect(shouldIncludeAdvancedNotificationType("urgent_prayer_request")).toBe(false);
    expect(shouldIncludeAdvancedNotificationType("new_post")).toBe(true);
  });

  it("excludes advanced types from prisma filters when disabled", () => {
    vi.stubEnv("MISSION_HUB_ADVANCED_NOTIFICATIONS_ENABLED", "false");
    expect(advancedNotificationExcludeFilter()).toEqual({
      type: { notIn: ["blog_published", "urgent_prayer_request"] },
    });
    vi.stubEnv("MISSION_HUB_ADVANCED_NOTIFICATIONS_ENABLED", "true");
    expect(advancedNotificationExcludeFilter()).toEqual({});
  });
});

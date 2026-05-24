import { describe, expect, it } from "vitest";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/lib/community/settings-types";
import { evaluatePostPublishNotificationEligibility } from "./post-notification-preferences";

describe("evaluatePostPublishNotificationEligibility", () => {
  it("enables channels when new posts and email are on", () => {
    const result = evaluatePostPublishNotificationEligibility(
      DEFAULT_NOTIFICATION_PREFERENCES,
      { spaceId: "space-1" },
    );
    expect(result.emailChannel).toBe(true);
    expect(result.inAppChannel).toBe(true);
    expect(result.skipReason).toBeNull();
  });

  it("disables when new posts off", () => {
    const result = evaluatePostPublishNotificationEligibility(
      { ...DEFAULT_NOTIFICATION_PREFERENCES, newPosts: false },
      { spaceId: "space-1" },
    );
    expect(result.emailChannel).toBe(false);
    expect(result.skipReason).toBe("new_posts_disabled");
  });

  it("disables when space muted", () => {
    const result = evaluatePostPublishNotificationEligibility(
      {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        mutedSpaceIds: ["space-1"],
      },
      { spaceId: "space-1" },
    );
    expect(result.spaceMuted).toBe(true);
    expect(result.skipReason).toBe("space_muted");
  });
});

import { describe, expect, it } from "vitest";
import {
  derivePostPrayerEngagementMetrics,
  derivePrayerRoomWelcomeMetrics,
  formatResponsesLabel,
  formatViewRequestsLabel,
  formatVoicePrayersLabel,
} from "./prayer-room-engagement-metrics";
import type { ReactionCounts } from "./types";

function emptyReactionCounts(): ReactionCounts {
  return {
    like: 0,
    love: 0,
    prayed: 0,
    celebrating: 0,
    encouraged: 0,
  };
}

describe("prayer room engagement metrics", () => {
  it("formats welcome view requests label", () => {
    expect(formatViewRequestsLabel(0)).toBe("View Requests");
    expect(formatViewRequestsLabel(2)).toBe("View Requests (2)");
  });

  it("derives room metrics without faking engagement totals", () => {
    const counts = { ...emptyReactionCounts(), prayed: 3 };
    const metrics = derivePrayerRoomWelcomeMetrics([
      {
        postType: "prayer",
        reactionCounts: counts,
        commentCount: 4,
        voiceResponseCount: 1,
      },
      {
        postType: "praise",
        reactionCounts: emptyReactionCounts(),
        commentCount: 0,
        voiceResponseCount: 0,
      },
    ]);

    expect(metrics.requestPostCount).toBe(2);
    expect(metrics.peoplePrayingCount).toBe(3);
    expect(metrics.responseCount).toBe(4);
    expect(metrics.voiceResponseCount).toBe(1);
  });

  it("derives per-post metrics and labels", () => {
    const metrics = derivePostPrayerEngagementMetrics({
      reactionCounts: { ...emptyReactionCounts(), prayed: 2 },
      commentCount: 3,
      voiceResponseCount: 1,
    });

    expect(metrics.peoplePrayingCount).toBe(2);
    expect(metrics.responseCount).toBe(3);
    expect(metrics.voiceResponseCount).toBe(1);
    expect(formatResponsesLabel(metrics.responseCount)).toBe("Responses (3)");
    expect(formatVoicePrayersLabel(metrics.voiceResponseCount)).toBe("Voice prayers (1)");
    expect(formatVoicePrayersLabel(0)).toBeNull();
  });
});

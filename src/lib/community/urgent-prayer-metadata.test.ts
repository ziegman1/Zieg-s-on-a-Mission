import { describe, expect, it } from "vitest";
import {
  canShowUrgentPrayerRequestOption,
  isUrgentPrayerRequest,
  buildUrgentPrayerPostMetadata,
} from "./urgent-prayer-metadata";

describe("urgent prayer metadata", () => {
  it("detects urgentPrayerRequest in metadata", () => {
    expect(isUrgentPrayerRequest(buildUrgentPrayerPostMetadata())).toBe(true);
    expect(isUrgentPrayerRequest({})).toBe(false);
  });

  it("shows urgent option for prayer-and-praise-room slug", () => {
    expect(
      canShowUrgentPrayerRequestOption({
        spaceSlug: "prayer-and-praise-room",
        postType: "update",
      }),
    ).toBe(true);
  });

  it("shows urgent option for prayer_requests category", () => {
    expect(
      canShowUrgentPrayerRequestOption({
        spaceSlug: "custom-prayer",
        notificationCategory: "prayer_requests",
        postType: "update",
      }),
    ).toBe(true);
  });

  it("shows urgent option when post type is prayer", () => {
    expect(
      canShowUrgentPrayerRequestOption({
        spaceSlug: "general",
        postType: "prayer",
      }),
    ).toBe(true);
  });

  it("hides urgent option outside prayer room context", () => {
    expect(
      canShowUrgentPrayerRequestOption({
        spaceSlug: "ministry-updates",
        notificationCategory: "ministry_updates",
        postType: "update",
      }),
    ).toBe(false);
  });
});

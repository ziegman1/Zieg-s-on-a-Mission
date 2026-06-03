import { describe, expect, it } from "vitest";
import { urgentPrayerPublishNotificationDedupeKey } from "./urgent-prayer-dedupe";
import { urgentPrayerPublishEmailDedupeKey } from "@/lib/mission-hub/email-dedupe";

describe("urgent prayer dedupe keys", () => {
  it("uses stable in-app dedupe key per post", () => {
    expect(urgentPrayerPublishNotificationDedupeKey("post-1")).toBe(
      "urgent-prayer:post-1:published",
    );
  });

  it("uses stable email dedupe key per post", () => {
    expect(urgentPrayerPublishEmailDedupeKey("post-1")).toBe("urgent-prayer:post-1:email");
  });
});

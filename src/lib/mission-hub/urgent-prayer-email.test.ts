import { describe, expect, it } from "vitest";
import {
  URGENT_PRAYER_EMAIL_SUBJECT,
  buildUrgentPrayerEmailContent,
} from "./urgent-prayer-email";

describe("buildUrgentPrayerEmailContent", () => {
  it("uses dedicated subject and CTA copy", () => {
    const content = buildUrgentPrayerEmailContent({
      spaceSlug: "prayer-and-praise-room",
      postId: "post-1",
      title: "Please pray for our team",
      body: "We need wisdom for a big decision this week.",
      excerpt: null,
    });

    expect(content.subject).toBe(URGENT_PRAYER_EMAIL_SUBJECT);
    expect(content.text).toContain("Please pray for our team");
    expect(content.text).toContain("Open Mission Hub to pray with us");
    expect(content.text).toContain("written prayer or record a voice prayer");
    expect(content.text).toContain("/community/prayer-and-praise-room#post-post-1");
    expect(content.html).toContain("Open Prayer Request");
  });
});

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { finalizeMissionHubEmailContent } from "./email-compliance-footer";

describe("email compliance footer", () => {
  const originalSecret = process.env.MISSION_HUB_EMAIL_PREFERENCES_SECRET;

  beforeEach(() => {
    process.env.MISSION_HUB_EMAIL_PREFERENCES_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.MISSION_HUB_EMAIL_PREFERENCES_SECRET = originalSecret;
  });

  it("appends manage preferences and unsubscribe links", () => {
    const result = finalizeMissionHubEmailContent({
      subject: "Test",
      html: "<p>Hello</p>",
      text: "Hello",
      recipientUserId: "user-1",
      recipientEmail: "member@example.com",
    });

    expect(result.html).toContain("Manage email preferences");
    expect(result.html).toContain("/community/unsubscribe?token=");
    expect(result.text).toContain("Unsubscribe from Mission Hub emails");
    expect(result.complianceLinks.unsubscribeUrl).toContain("/community/unsubscribe?token=");
  });
});

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  buildUnsubscribeUrl,
  createEmailPreferenceToken,
  verifyEmailPreferenceToken,
} from "./email-preference-tokens";

describe("email preference tokens", () => {
  const originalSecret = process.env.MISSION_HUB_EMAIL_PREFERENCES_SECRET;

  beforeEach(() => {
    process.env.MISSION_HUB_EMAIL_PREFERENCES_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.MISSION_HUB_EMAIL_PREFERENCES_SECRET = originalSecret;
  });

  it("creates and verifies preference tokens", () => {
    const token = createEmailPreferenceToken({
      userId: "user-1",
      email: "member@example.com",
      purpose: "preferences",
    });
    expect(token).toBeTruthy();
    const payload = verifyEmailPreferenceToken(token!, "preferences");
    expect(payload?.userId).toBe("user-1");
    expect(payload?.email).toBe("member@example.com");
  });

  it("builds unsubscribe URLs with encoded tokens", () => {
    const token = createEmailPreferenceToken({
      userId: "user-1",
      email: "member@example.com",
      purpose: "unsubscribe",
    });
    expect(buildUnsubscribeUrl(token!)).toContain("/community/unsubscribe?token=");
  });
});

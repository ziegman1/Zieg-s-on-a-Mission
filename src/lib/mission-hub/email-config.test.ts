import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getMissionHubEmailConfigProblem,
  isMissionHubEmailNotificationsEnabled,
  missionHubEmailDisabledMessage,
} from "./email-config";

describe("mission-hub email config", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS;
    delete process.env.RESEND_API_KEY;
    delete process.env.MISSION_HUB_FROM_EMAIL;
  });

  afterEach(() => {
    process.env = env;
  });

  it("is disabled by default", () => {
    expect(isMissionHubEmailNotificationsEnabled()).toBe(false);
    expect(getMissionHubEmailConfigProblem()).toBe("disabled");
    expect(missionHubEmailDisabledMessage("disabled")).toContain(
      "ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS",
    );
  });

  it("requires RESEND_API_KEY when enabled", () => {
    process.env.ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS = "true";
    process.env.MISSION_HUB_FROM_EMAIL = "hello@ziegsonamission.com";
    expect(getMissionHubEmailConfigProblem()).toBe("missing_resend_key");
  });

  it("is ready when enabled with key and from email", () => {
    process.env.ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS = "true";
    process.env.RESEND_API_KEY = "re_test";
    process.env.MISSION_HUB_FROM_EMAIL = "hello@ziegsonamission.com";
    expect(getMissionHubEmailConfigProblem()).toBeNull();
  });
});

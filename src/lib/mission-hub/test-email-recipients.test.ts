import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getTestMissionHubEmailRecipientSet,
  resolveMissionHubEmailSendPolicy,
  shouldSendMissionHubEmailToRecipient,
} from "./test-email-recipients";

describe("test-email-recipients", () => {
  const prev = process.env.TEST_MISSION_HUB_EMAIL_RECIPIENTS;

  afterEach(() => {
    if (prev === undefined) delete process.env.TEST_MISSION_HUB_EMAIL_RECIPIENTS;
    else process.env.TEST_MISSION_HUB_EMAIL_RECIPIENTS = prev;
  });

  it("parses comma-separated allowlist", () => {
    process.env.TEST_MISSION_HUB_EMAIL_RECIPIENTS = "A@Example.com, b@test.org ";
    const set = getTestMissionHubEmailRecipientSet();
    expect(set?.has("a@example.com")).toBe(true);
    expect(set?.has("b@test.org")).toBe(true);
  });

  it("blocks all emails in smoke test when allowlist unset", () => {
    delete process.env.TEST_MISSION_HUB_EMAIL_RECIPIENTS;
    const policy = resolveMissionHubEmailSendPolicy({ smokeTest: true });
    const gate = shouldSendMissionHubEmailToRecipient("any@example.com", policy);
    expect(gate.send).toBe(false);
    if (!gate.send) expect(gate.reason).toBe("smoke_test_no_test_recipients");
  });

  it("allows only allowlisted emails in smoke test", () => {
    process.env.TEST_MISSION_HUB_EMAIL_RECIPIENTS = "safe@example.com";
    const policy = resolveMissionHubEmailSendPolicy({ smokeTest: true });
    expect(shouldSendMissionHubEmailToRecipient("safe@example.com", policy).send).toBe(true);
    expect(shouldSendMissionHubEmailToRecipient("other@example.com", policy).send).toBe(false);
  });

  it("allows all eligible in production mode", () => {
    process.env.TEST_MISSION_HUB_EMAIL_RECIPIENTS = "safe@example.com";
    const policy = resolveMissionHubEmailSendPolicy({ smokeTest: false });
    expect(policy.allowAllEligible).toBe(true);
    expect(shouldSendMissionHubEmailToRecipient("anyone@example.com", policy).send).toBe(true);
  });
});

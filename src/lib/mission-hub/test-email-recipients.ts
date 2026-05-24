import "server-only";

/** Comma-separated allowlist from TEST_MISSION_HUB_EMAIL_RECIPIENTS (lowercased). */
export function getTestMissionHubEmailRecipientSet(): Set<string> | null {
  const raw = process.env.TEST_MISSION_HUB_EMAIL_RECIPIENTS?.trim();
  if (!raw) return null;
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return emails.length > 0 ? new Set(emails) : null;
}

export type MissionHubEmailSendPolicy = {
  /** When true, only TEST_MISSION_HUB_EMAIL_RECIPIENTS may receive email (or none if unset). */
  smokeTest: boolean;
};

export type MissionHubEmailPolicyResolution = {
  smokeTest: boolean;
  testRecipientsConfigured: boolean;
  allowAllEligible: boolean;
  allowedEmails: Set<string> | null;
};

export function resolveMissionHubEmailSendPolicy(
  options: MissionHubEmailSendPolicy = { smokeTest: false },
): MissionHubEmailPolicyResolution {
  const allowedEmails = getTestMissionHubEmailRecipientSet();
  const testRecipientsConfigured = Boolean(allowedEmails?.size);

  if (options.smokeTest) {
    return {
      smokeTest: true,
      testRecipientsConfigured,
      allowAllEligible: false,
      allowedEmails,
    };
  }

  return {
    smokeTest: false,
    testRecipientsConfigured,
    allowAllEligible: true,
    allowedEmails: null,
  };
}

export type MissionHubEmailSkipReason =
  | "smoke_test_no_test_recipients"
  | "not_in_test_recipient_allowlist"
  | "email_channel_disabled"
  | "email_notifications_disabled";

export function shouldSendMissionHubEmailToRecipient(
  recipientEmail: string,
  policy: MissionHubEmailPolicyResolution,
): { send: true } | { send: false; reason: MissionHubEmailSkipReason } {
  const normalized = recipientEmail.trim().toLowerCase();
  if (!normalized) {
    return { send: false, reason: "not_in_test_recipient_allowlist" };
  }

  if (policy.allowAllEligible) {
    return { send: true };
  }

  if (!policy.testRecipientsConfigured) {
    return { send: false, reason: "smoke_test_no_test_recipients" };
  }

  if (policy.allowedEmails?.has(normalized)) {
    return { send: true };
  }

  return { send: false, reason: "not_in_test_recipient_allowlist" };
}

export function isMissionHubEmailDebugEnabled(): boolean {
  return process.env.MISSION_HUB_EMAIL_DEBUG === "1";
}

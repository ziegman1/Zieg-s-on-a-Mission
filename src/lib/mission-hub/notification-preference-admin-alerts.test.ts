import { describe, expect, it } from "vitest";
import {
  getMissionHubAdminAlertEmails,
  shouldSendAdminAlertForEvent,
} from "@/lib/mission-hub/notification-preference-admin-alerts";

describe("notification-preference-admin-alerts", () => {
  it("parses MISSION_HUB_ADMIN_ALERT_EMAILS", () => {
    process.env.MISSION_HUB_ADMIN_ALERT_EMAILS = " Admin@Example.com, ops@example.com ";
    expect(getMissionHubAdminAlertEmails()).toEqual(["admin@example.com", "ops@example.com"]);
    delete process.env.MISSION_HUB_ADMIN_ALERT_EMAILS;
  });

  it("alerts on unsubscribe and email disabled", () => {
    expect(
      shouldSendAdminAlertForEvent({
        eventType: "unsubscribe_link_used",
        metadata: {},
      }),
    ).toBe(true);
    expect(
      shouldSendAdminAlertForEvent({
        eventType: "email_channel_disabled",
        metadata: {},
      }),
    ).toBe(true);
  });

  it("does not alert on weekly digest toggles", () => {
    expect(
      shouldSendAdminAlertForEvent({
        eventType: "weekly_digest_disabled",
        metadata: {},
      }),
    ).toBe(false);
  });

  it("alerts on bounce/complaint suppressions only", () => {
    expect(
      shouldSendAdminAlertForEvent({
        eventType: "suppression_created",
        metadata: { reason: "bounce" },
      }),
    ).toBe(true);
    expect(
      shouldSendAdminAlertForEvent({
        eventType: "suppression_created",
        metadata: { reason: "unsubscribe" },
      }),
    ).toBe(false);
  });

  it("alerts when suppression is removed", () => {
    expect(
      shouldSendAdminAlertForEvent({
        eventType: "suppression_removed",
        metadata: {},
      }),
    ).toBe(true);
  });
});

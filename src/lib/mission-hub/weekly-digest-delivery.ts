import "server-only";

import { isMissionHubEmailNotificationsEnabled } from "@/lib/mission-hub/email-config";
import {
  getWeeklyDigestEmailDisabledReason,
  queueAndSendWeeklyDigestEmail,
} from "@/lib/mission-hub/weekly-digest-email";
import {
  listWeeklyDigestEmailRecipients,
  type WeeklyDigestRecipient,
} from "@/lib/mission-hub/weekly-digest-recipients";
import type {
  DigestWindowInput,
  WeeklyMissionHubDigest,
} from "@/lib/mission-hub/weekly-digest-core";
import { prepareWeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest";
import {
  isMissionHubEmailDebugEnabled,
  resolveMissionHubEmailSendPolicy,
} from "@/lib/mission-hub/test-email-recipients";

export type WeeklyDigestDeliveryResult = {
  digest: WeeklyMissionHubDigest;
  emailEnabled: boolean;
  emailDisabledReason: string | null;
  eligibleRecipients: number;
  sent: number;
  deduped: number;
  failed: number;
  skipped: number;
  errors: string[];
};

export type DeliverWeeklyDigestOptions = {
  window?: DigestWindowInput;
  /** Admin test — sends to one address regardless of weekly digest prefs. */
  testRecipient?: WeeklyDigestRecipient;
  /** Send to all eligible members (requires hasContent). */
  broadcastToMembers?: boolean;
  /** Override dedupe for member sends. */
  forceResend?: boolean;
  /** Safe smoke test — email only to TEST_MISSION_HUB_EMAIL_RECIPIENTS. */
  smokeTest?: boolean;
};

function summarizeQueueOutcome(
  outcome: Awaited<ReturnType<typeof queueAndSendWeeklyDigestEmail>>,
  tallies: Pick<WeeklyDigestDeliveryResult, "sent" | "deduped" | "failed" | "skipped" | "errors">,
): void {
  if (outcome.action === "sent") {
    tallies.sent += 1;
    return;
  }
  if (outcome.action === "deduped") {
    tallies.deduped += 1;
    return;
  }
  if (outcome.action === "failed") {
    tallies.failed += 1;
    tallies.errors.push(outcome.error);
    return;
  }
  if (outcome.action === "skipped") {
    tallies.skipped += 1;
  }
}

/**
 * Deliver the weekly Mission Hub digest email (admin manual or scheduled cron).
 */
export async function deliverWeeklyMissionHubDigest(
  options: DeliverWeeklyDigestOptions,
): Promise<WeeklyDigestDeliveryResult> {
  const emailEnabled = isMissionHubEmailNotificationsEnabled();
  const emailDisabledReason = getWeeklyDigestEmailDisabledReason();
  const emailPolicy = resolveMissionHubEmailSendPolicy({
    smokeTest: options.smokeTest === true,
  });

  const digest = await prepareWeeklyMissionHubDigest(options.window ?? {});

  const tallies = {
    sent: 0,
    deduped: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  const recipients = await listWeeklyDigestEmailRecipients();

  if (!emailEnabled) {
    return {
      digest,
      emailEnabled: false,
      emailDisabledReason,
      eligibleRecipients: recipients.length,
      ...tallies,
    };
  }

  if (options.testRecipient) {
    const outcome = await queueAndSendWeeklyDigestEmail({
      recipientUserId: options.testRecipient.userId,
      recipientEmail: options.testRecipient.email,
      digest,
      testSend: true,
      forceResend: true,
      emailPolicy,
    });
    summarizeQueueOutcome(outcome, tallies);

    if (isMissionHubEmailDebugEnabled()) {
      console.info("[weekly-digest] test send complete", {
        userId: options.testRecipient.userId,
        outcome: outcome.action,
      });
    }

    return {
      digest,
      emailEnabled: true,
      emailDisabledReason: null,
      eligibleRecipients: recipients.length,
      ...tallies,
    };
  }

  if (options.broadcastToMembers) {
    if (!digest.hasContent) {
      return {
        digest,
        emailEnabled: true,
        emailDisabledReason: null,
        eligibleRecipients: recipients.length,
        ...tallies,
        errors: ["Cannot send weekly digest to members when there is no content for this period."],
      };
    }

    for (const recipient of recipients) {
      try {
        const outcome = await queueAndSendWeeklyDigestEmail({
          recipientUserId: recipient.userId,
          recipientEmail: recipient.email,
          digest,
          forceResend: options.forceResend === true,
          emailPolicy,
        });
        summarizeQueueOutcome(outcome, tallies);
      } catch (e) {
        tallies.failed += 1;
        tallies.errors.push(e instanceof Error ? e.message : String(e));
      }
    }

    if (isMissionHubEmailDebugEnabled()) {
      console.info("[weekly-digest] member broadcast complete", {
        weekEnd: digest.dateRange.end,
        sent: tallies.sent,
        deduped: tallies.deduped,
        failed: tallies.failed,
        skipped: tallies.skipped,
      });
    }
  }

  return {
    digest,
    emailEnabled: true,
    emailDisabledReason: null,
    eligibleRecipients: recipients.length,
    ...tallies,
  };
}

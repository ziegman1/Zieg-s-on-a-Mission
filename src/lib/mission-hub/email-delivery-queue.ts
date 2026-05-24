import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  MissionHubEmailDeliveryPayload,
  QueueMissionHubEmailResult,
} from "@/lib/mission-hub/email-delivery-types";
import {
  isMissionHubEmailDebugEnabled,
  resolveMissionHubEmailSendPolicy,
  shouldSendMissionHubEmailToRecipient,
  type MissionHubEmailSendPolicy,
} from "@/lib/mission-hub/test-email-recipients";
import { sendMissionHubEmail } from "@/lib/mission-hub/resend-client";

/**
 * Queue + send a deduped Mission Hub email and persist delivery row.
 * Honors smoke-test allowlist via {@link MissionHubEmailSendPolicy}.
 */
export async function queueMissionHubEmailDelivery(
  input: MissionHubEmailDeliveryPayload,
  policyOptions: MissionHubEmailSendPolicy = { smokeTest: false },
): Promise<QueueMissionHubEmailResult> {
  const policy = resolveMissionHubEmailSendPolicy(policyOptions);
  const gate = shouldSendMissionHubEmailToRecipient(input.recipientEmail, policy);
  if (!gate.send) {
    if (isMissionHubEmailDebugEnabled()) {
      console.info("[mission-hub-email] skipped recipient", {
        to: input.recipientEmail,
        dedupeKey: input.dedupeKey,
        reason: gate.reason,
        smokeTest: policy.smokeTest,
      });
    }
    return { action: "skipped", reason: gate.reason };
  }

  const existing = await prisma.missionHubEmailDeliveryRecord.findUnique({
    where: {
      recipientUserId_dedupeKey: {
        recipientUserId: input.recipientUserId,
        dedupeKey: input.dedupeKey,
      },
    },
  });

  if (existing?.status === "sent" && !input.forceResend) {
    return { action: "deduped", deliveryId: existing.id };
  }

  const metadata = {
    ...input.metadata,
    notificationKind: input.notificationKind,
  } satisfies Prisma.InputJsonValue;

  const delivery =
    existing && input.forceResend
      ? await prisma.missionHubEmailDeliveryRecord.update({
          where: { id: existing.id },
          data: {
            recipientEmail: input.recipientEmail,
            notificationKind: input.notificationKind,
            status: "pending",
            errorMessage: null,
            resendMessageId: null,
            sentAt: null,
            metadata,
          },
        })
      : existing
        ? existing
        : await prisma.missionHubEmailDeliveryRecord.create({
            data: {
              recipientUserId: input.recipientUserId,
              recipientEmail: input.recipientEmail,
              notificationKind: input.notificationKind,
              dedupeKey: input.dedupeKey,
              status: "pending",
              metadata,
            },
          });

  const sendResult = await sendMissionHubEmail({
    to: input.recipientEmail,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (!sendResult.ok) {
    await prisma.missionHubEmailDeliveryRecord.update({
      where: { id: delivery.id },
      data: {
        status: "failed",
        errorMessage: sendResult.error,
      },
    });
    if (isMissionHubEmailDebugEnabled()) {
      console.error("[mission-hub-email] delivery failed", {
        deliveryId: delivery.id,
        dedupeKey: input.dedupeKey,
        to: input.recipientEmail,
        error: sendResult.error,
      });
    }
    return { action: "failed", deliveryId: delivery.id, error: sendResult.error };
  }

  await prisma.missionHubEmailDeliveryRecord.update({
    where: { id: delivery.id },
    data: {
      status: "sent",
      resendMessageId: sendResult.resendMessageId,
      sentAt: new Date(),
      errorMessage: null,
    },
  });

  if (isMissionHubEmailDebugEnabled()) {
    console.info("[mission-hub-email] delivery sent", {
      deliveryId: delivery.id,
      dedupeKey: input.dedupeKey,
      to: input.recipientEmail,
      resendMessageId: sendResult.resendMessageId,
      sourceKind: input.metadata.sourceKind,
      sourceId: input.metadata.sourceId,
      sourcePostId: input.metadata.sourcePostId,
    });
  }

  return {
    action: "sent",
    deliveryId: delivery.id,
    resendMessageId: sendResult.resendMessageId,
  };
}

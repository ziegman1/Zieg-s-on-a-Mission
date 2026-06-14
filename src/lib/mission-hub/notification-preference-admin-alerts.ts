import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { EmailSuppressionReason } from "@/lib/mission-hub/email-suppressions";
import type { NotificationPreferenceActorType } from "@/lib/mission-hub/notification-preference-event-types";
import { sendMissionHubEmail } from "@/lib/mission-hub/resend-client";

const ALERT_EVENT_TYPES = new Set([
  "unsubscribe_link_used",
  "email_channel_disabled",
  "suppression_created",
  "suppression_removed",
]);

const ALERT_SUPPRESSION_REASONS = new Set<EmailSuppressionReason>(["bounce", "complaint"]);

export function getMissionHubAdminAlertEmails(): string[] {
  const raw = process.env.MISSION_HUB_ADMIN_ALERT_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function shouldSendAdminAlertForEvent(input: {
  eventType: string;
  metadata: Record<string, unknown>;
}): boolean {
  if (!ALERT_EVENT_TYPES.has(input.eventType)) return false;

  if (input.eventType === "suppression_created") {
    const reason = String(input.metadata.reason ?? "");
    return ALERT_SUPPRESSION_REASONS.has(reason as EmailSuppressionReason);
  }

  return true;
}

function formatAlertBody(input: {
  eventType: string;
  email: string;
  memberName: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}): { subject: string; html: string; text: string } {
  const label = input.eventType.replace(/_/g, " ");
  const member = input.memberName ?? "Unknown member";
  const reason =
    input.metadata.reason != null ? String(input.metadata.reason) : null;
  const source =
    input.metadata.source != null ? String(input.metadata.source) : null;

  const lines = [
    `Event: ${label}`,
    `Member: ${member}`,
    `Email: ${input.email}`,
    `Time: ${input.createdAt.toISOString()}`,
    reason ? `Reason: ${reason}` : null,
    source ? `Source: ${source}` : null,
  ].filter(Boolean);

  const text = lines.join("\n");
  const html = lines
    .map(
      (line) =>
        `<p style="margin:0 0 8px;font-family:sans-serif;font-size:14px;">${line}</p>`,
    )
    .join("");

  return {
    subject: `[Mission Hub] ${label} — ${input.email}`,
    html,
    text,
  };
}

/** Send at most one admin alert email per audit event row. */
export async function maybeSendAdminPreferenceAlert(eventId: string): Promise<void> {
  const recipients = getMissionHubAdminAlertEmails();
  if (recipients.length === 0) return;

  const event = await prisma.notificationPreferenceEventRecord.findUnique({
    where: { id: eventId },
    include: {
      member: {
        select: { firstName: true, lastName: true, displayName: true },
      },
    },
  });
  if (!event) return;

  const metadata = (event.metadata ?? {}) as Record<string, unknown>;
  if (metadata.adminAlertSent === true) return;

  if (
    !shouldSendAdminAlertForEvent({
      eventType: event.eventType,
      metadata,
    })
  ) {
    return;
  }

  const memberName = event.member
    ? event.member.displayName?.trim() ||
      `${event.member.firstName} ${event.member.lastName}`.trim() ||
      null
    : null;

  const content = formatAlertBody({
    eventType: event.eventType,
    email: event.email,
    memberName,
    metadata,
    createdAt: event.createdAt,
  });

  for (const to of recipients) {
    const result = await sendMissionHubEmail({
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });
    if (!result.ok) {
      console.warn("[notification-preference-admin-alerts] send failed", {
        eventId,
        to,
        error: result.error,
      });
      return;
    }
  }

  await prisma.notificationPreferenceEventRecord.update({
    where: { id: eventId },
    data: {
      metadata: {
        ...metadata,
        adminAlertSent: true,
        adminAlertSentAt: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}

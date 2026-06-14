import "server-only";

import { Prisma } from "@prisma/client";
import type { NotificationPreferences } from "@/lib/community/settings-types";
import { prisma } from "@/lib/db";
import { diffNotificationPreferenceEvents } from "@/lib/mission-hub/notification-preference-event-diff";
import type {
  NotificationPreferenceActorType,
  NotificationPreferenceEventType,
  RecordPreferenceEventInput,
} from "@/lib/mission-hub/notification-preference-event-types";
import { maybeSendAdminPreferenceAlert } from "@/lib/mission-hub/notification-preference-admin-alerts";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function resolveMemberId(userId: string): Promise<string | null> {
  const member = await prisma.communityMemberRecord.findUnique({
    where: { userId },
    select: { id: true },
  });
  return member?.id ?? null;
}

function prefsToJson(
  prefs: NotificationPreferences | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (!prefs) return Prisma.JsonNull;
  return prefs as unknown as Prisma.InputJsonValue;
}

/** Persist one preference audit event and optionally notify admins. */
export async function recordNotificationPreferenceEvent(
  input: RecordPreferenceEventInput,
): Promise<string> {
  const email = normalizeEmail(input.email);
  const memberId =
    input.memberId !== undefined
      ? input.memberId
      : await resolveMemberId(input.userId);

  const row = await prisma.notificationPreferenceEventRecord.create({
    data: {
      userId: input.userId,
      memberId,
      email,
      eventType: input.eventType,
      actorType: input.actorType,
      actorUserId: input.actorUserId ?? null,
      previousPrefs: prefsToJson(input.previousPrefs),
      nextPrefs: prefsToJson(input.nextPrefs),
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  await maybeSendAdminPreferenceAlert(row.id);
  return row.id;
}

/** Log all derived events from a preference change. */
export async function recordPreferenceDiffEvents(input: {
  userId: string;
  email: string;
  memberId?: string | null;
  previous: NotificationPreferences;
  next: NotificationPreferences;
  actorType: NotificationPreferenceActorType;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const eventTypes = diffNotificationPreferenceEvents(input.previous, input.next);
  if (eventTypes.length === 0) return;

  for (const eventType of eventTypes) {
    await recordNotificationPreferenceEvent({
      userId: input.userId,
      memberId: input.memberId,
      email: input.email,
      eventType,
      actorType: input.actorType,
      actorUserId: input.actorUserId,
      previousPrefs: input.previous,
      nextPrefs: input.next,
      metadata: input.metadata,
    });
  }
}

export async function recordPartnershipPreferenceSyncEvent(input: {
  userId: string;
  email: string;
  memberId?: string | null;
  previous: NotificationPreferences;
  next: NotificationPreferences;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await recordNotificationPreferenceEvent({
    userId: input.userId,
    memberId: input.memberId,
    email: input.email,
    eventType: "partnership_prefs_synced",
    actorType: "user",
    actorUserId: input.actorUserId ?? input.userId,
    previousPrefs: input.previous,
    nextPrefs: input.next,
    metadata: input.metadata,
  });

  await recordPreferenceDiffEvents({
    userId: input.userId,
    email: input.email,
    memberId: input.memberId,
    previous: input.previous,
    next: input.next,
    actorType: "user",
    actorUserId: input.actorUserId ?? input.userId,
    metadata: { ...input.metadata, source: "partnership_onboarding" },
  });
}

export async function recordUnsubscribeLinkUsedEvent(input: {
  userId: string;
  email: string;
  memberId?: string | null;
  previous: NotificationPreferences;
  next: NotificationPreferences;
}): Promise<void> {
  await recordNotificationPreferenceEvent({
    userId: input.userId,
    memberId: input.memberId,
    email: input.email,
    eventType: "unsubscribe_link_used",
    actorType: "user",
    actorUserId: input.userId,
    previousPrefs: input.previous,
    nextPrefs: input.next,
    metadata: { source: "mission_hub_unsubscribe" },
  });
}

export async function recordSuppressionCreatedEvent(input: {
  userId?: string | null;
  email: string;
  reason: string;
  actorType: NotificationPreferenceActorType;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const email = normalizeEmail(input.email);
  if (!email) return;

  let userId = input.userId ?? null;
  if (!userId) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }
  if (!userId) {
    console.warn("[notification-preference-events] suppression_created skipped — no userId", {
      email,
      reason: input.reason,
    });
    return;
  }

  const memberId = await resolveMemberId(userId);

  await recordNotificationPreferenceEvent({
    userId,
    memberId,
    email,
    eventType: "suppression_created",
    actorType: input.actorType,
    actorUserId: input.actorUserId,
    metadata: { reason: input.reason, ...input.metadata },
  });
}

export async function recordSuppressionRemovedEvent(input: {
  userId?: string | null;
  email: string;
  actorType: NotificationPreferenceActorType;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const email = normalizeEmail(input.email);
  if (!email) return;

  let userId = input.userId ?? null;
  if (!userId) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    userId = user?.id ?? null;
  }
  if (!userId) return;

  const memberId = await resolveMemberId(userId);

  await recordNotificationPreferenceEvent({
    userId,
    memberId,
    email,
    eventType: "suppression_removed",
    actorType: input.actorType,
    actorUserId: input.actorUserId,
    metadata: input.metadata,
  });
}

export type NotificationPreferenceEventRow = {
  id: string;
  userId: string;
  memberId: string | null;
  email: string;
  eventType: NotificationPreferenceEventType;
  actorType: NotificationPreferenceActorType;
  actorUserId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  memberName: string | null;
};

export type NotificationPreferenceEventSummary30Days = {
  weekly_digest_enabled: number;
  weekly_digest_disabled: number;
  email_channel_enabled: number;
  email_channel_disabled: number;
  unsubscribe_link_used: number;
  suppression_created: number;
  suppression_removed: number;
};

const SUMMARY_EVENT_TYPES: NotificationPreferenceEventType[] = [
  "weekly_digest_enabled",
  "weekly_digest_disabled",
  "email_channel_enabled",
  "email_channel_disabled",
  "unsubscribe_link_used",
  "suppression_created",
  "suppression_removed",
];

export async function loadNotificationPreferenceEventsForAdmin(input?: {
  eventType?: NotificationPreferenceEventType | "all";
  limit?: number;
}): Promise<NotificationPreferenceEventRow[]> {
  const limit = Math.min(Math.max(input?.limit ?? 50, 1), 200);
  const where =
    input?.eventType && input.eventType !== "all"
      ? { eventType: input.eventType }
      : undefined;

  const rows = await prisma.notificationPreferenceEventRecord.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      member: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
        },
      },
    },
  });

  return rows.map((row) => {
    const member = row.member;
    const memberName = member
      ? member.displayName?.trim() ||
        `${member.firstName} ${member.lastName}`.trim() ||
        null
      : null;

    return {
      id: row.id,
      userId: row.userId,
      memberId: row.memberId,
      email: row.email,
      eventType: row.eventType as NotificationPreferenceEventType,
      actorType: row.actorType as NotificationPreferenceActorType,
      actorUserId: row.actorUserId,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
      memberName,
    };
  });
}

export async function loadNotificationPreferenceEventSummary30Days(): Promise<NotificationPreferenceEventSummary30Days> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const grouped = await prisma.notificationPreferenceEventRecord.groupBy({
    by: ["eventType"],
    where: {
      createdAt: { gte: since },
      eventType: { in: [...SUMMARY_EVENT_TYPES] },
    },
    _count: { id: true },
  });

  const summary: NotificationPreferenceEventSummary30Days = {
    weekly_digest_enabled: 0,
    weekly_digest_disabled: 0,
    email_channel_enabled: 0,
    email_channel_disabled: 0,
    unsubscribe_link_used: 0,
    suppression_created: 0,
    suppression_removed: 0,
  };

  for (const row of grouped) {
    const key = row.eventType as keyof NotificationPreferenceEventSummary30Days;
    if (key in summary) {
      summary[key] = row._count.id;
    }
  }

  return summary;
}

/** Phase 1: verify email_suppressions table exists (digest send prerequisite). */
export async function verifyEmailSuppressionsTableReady(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    await prisma.$queryRaw`SELECT 1 FROM "email_suppressions" LIMIT 1`;
    return { ok: true, message: "email_suppressions table is available" };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      message: `email_suppressions table missing or unreachable: ${message}`,
    };
  }
}

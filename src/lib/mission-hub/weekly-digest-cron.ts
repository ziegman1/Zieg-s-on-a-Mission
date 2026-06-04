import "server-only";

import type { DigestDateRange } from "@/lib/mission-hub/weekly-digest-core";
import { deliverWeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest-delivery";

/**
 * Vercel Cron schedule (UTC). Friday 12:00 UTC ≈ 8:00 AM US Eastern during EDT.
 * During EST (standard time), delivery is 7:00 AM Eastern. See docs for DST notes.
 */
export const WEEKLY_DIGEST_CRON_SCHEDULE_UTC = "0 12 * * 5";

export type WeeklyDigestCronSkipReason = "cron_disabled" | "email_disabled" | "no_content";

export type WeeklyDigestCronSummary = {
  startedAt: string;
  dateRange: DigestDateRange;
  eligibleRecipients: number;
  hasContent: boolean;
  sent: number;
  deduped: number;
  skipped: number;
  failed: number;
  errors: string[];
};

export type WeeklyDigestCronResult =
  | ({ ok: true; status: "completed" } & WeeklyDigestCronSummary)
  | ({
      ok: true;
      status: "skipped";
      skipReason: WeeklyDigestCronSkipReason;
      emailDisabledReason?: string | null;
    } & WeeklyDigestCronSummary);

export function isMissionHubWeeklyDigestCronEnabled(): boolean {
  return process.env.MISSION_HUB_WEEKLY_DIGEST_CRON_ENABLED === "true";
}

function emptySummary(startedAt: string): WeeklyDigestCronSummary {
  return {
    startedAt,
    dateRange: { start: "", end: "" },
    eligibleRecipients: 0,
    hasContent: false,
    sent: 0,
    deduped: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };
}

function summaryFromDelivery(
  startedAt: string,
  delivery: Awaited<ReturnType<typeof deliverWeeklyMissionHubDigest>>,
): WeeklyDigestCronSummary {
  return {
    startedAt,
    dateRange: delivery.digest.dateRange,
    eligibleRecipients: delivery.eligibleRecipients,
    hasContent: delivery.digest.hasContent,
    sent: delivery.sent,
    deduped: delivery.deduped,
    skipped: delivery.skipped,
    failed: delivery.failed,
    errors: delivery.errors,
  };
}

export function logWeeklyDigestCronSummary(
  payload: WeeklyDigestCronResult | (WeeklyDigestCronSummary & { status: string; skipReason?: string }),
): void {
  console.info("[weekly-digest-cron]", payload);
}

/**
 * Scheduled Friday delivery — uses Phase 2 member broadcast (dedupe, hasContent, email flag).
 */
export async function runScheduledWeeklyDigestCron(): Promise<WeeklyDigestCronResult> {
  const startedAt = new Date().toISOString();

  if (!isMissionHubWeeklyDigestCronEnabled()) {
    const summary = emptySummary(startedAt);
    const result = {
      ok: true as const,
      status: "skipped" as const,
      skipReason: "cron_disabled" as const,
      ...summary,
    };
    logWeeklyDigestCronSummary(result);
    return result;
  }

  const delivery = await deliverWeeklyMissionHubDigest({ broadcastToMembers: true });
  const summary = summaryFromDelivery(startedAt, delivery);

  if (!delivery.emailEnabled) {
    const result = {
      ok: true as const,
      status: "skipped" as const,
      skipReason: "email_disabled" as const,
      emailDisabledReason: delivery.emailDisabledReason,
      ...summary,
    };
    logWeeklyDigestCronSummary(result);
    return result;
  }

  if (!delivery.digest.hasContent) {
    const result = {
      ok: true as const,
      status: "skipped" as const,
      skipReason: "no_content" as const,
      ...summary,
    };
    logWeeklyDigestCronSummary(result);
    return result;
  }

  const result = {
    ok: true as const,
    status: "completed" as const,
    ...summary,
  };
  logWeeklyDigestCronSummary(result);
  return result;
}

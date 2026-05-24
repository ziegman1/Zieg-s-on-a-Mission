import "server-only";

import { getNewsletterById } from "@/lib/newsletter/newsletter-db";
import {
  removeNewsletterFromMissionHub,
  getNewsletterMissionHubDiagnostics,
} from "@/lib/newsletter/mission-hub-lifecycle";
import { notifyMissionHubMembersOfNewsletterPublish } from "@/lib/newsletter/notify";
import { prisma } from "@/lib/db";
import { newsletterPublishEmailDedupeKey } from "@/lib/mission-hub/email-dedupe";
import { newsletterPublishNotificationDedupeKey } from "@/lib/newsletter/mission-hub-dedupe";
import {
  getTestMissionHubEmailRecipientSet,
  resolveMissionHubEmailSendPolicy,
} from "@/lib/mission-hub/test-email-recipients";
import type { NewsletterPublishNotificationsResult } from "@/lib/newsletter/member-notifications-prep";

export type NewsletterHubSmokeTestResult = {
  ok: boolean;
  newsletterId: string;
  newsletterSlug: string;
  newsletterStatus: string;
  removedFromHub: {
    postsArchived: number;
    notificationsDeleted: number;
    emailDeliveriesDeleted: number;
  };
  ministryUpdatesPostId: string | null;
  newsletterSpacePostId: string | null;
  ministryUpdatesSpaceSlug: string | null;
  newsletterSpaceSlug: string | null;
  notifications: NewsletterPublishNotificationsResult;
  emailDeliveriesAfter: Array<{
    id: string;
    recipientEmail: string;
    status: string;
    resendMessageId: string | null;
    errorMessage: string | null;
  }>;
  inAppNotificationCount: number;
  testEmailPolicy: ReturnType<typeof resolveMissionHubEmailSendPolicy>;
  resendMessageIds: string[];
  logLines: string[];
  error?: string;
};

async function loadEmailDeliveryRows(newsletterId: string) {
  const dedupeKey = newsletterPublishEmailDedupeKey(newsletterId);
  return prisma.missionHubEmailDeliveryRecord.findMany({
    where: { dedupeKey },
    select: {
      id: true,
      recipientEmail: true,
      status: true,
      resendMessageId: true,
      errorMessage: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Admin smoke test: reset Mission Hub presence, republish announcements + notifications.
 * Email only sends to TEST_MISSION_HUB_EMAIL_RECIPIENTS when set; otherwise no broadcast.
 */
export async function runNewsletterMissionHubSmokeTest(input: {
  newsletterId: string;
  publisherUserId?: string | null;
  forceResendEmail?: boolean;
}): Promise<NewsletterHubSmokeTestResult> {
  const logLines: string[] = [];
  const testEmailPolicy = resolveMissionHubEmailSendPolicy({ smokeTest: true });
  const testRecipients = getTestMissionHubEmailRecipientSet();

  logLines.push(`Newsletter Hub smoke test — newsletterId=${input.newsletterId}`);
  logLines.push(
    testRecipients?.size
      ? `Test email allowlist: ${[...testRecipients].join(", ")}`
      : "No TEST_MISSION_HUB_EMAIL_RECIPIENTS — emails will NOT be sent (safe mode).",
  );

  const newsletter = await getNewsletterById(input.newsletterId);
  if (!newsletter) {
    return {
      ok: false,
      newsletterId: input.newsletterId,
      newsletterSlug: "",
      newsletterStatus: "NOT_FOUND",
      removedFromHub: { postsArchived: 0, notificationsDeleted: 0, emailDeliveriesDeleted: 0 },
      ministryUpdatesPostId: null,
      newsletterSpacePostId: null,
      ministryUpdatesSpaceSlug: null,
      newsletterSpaceSlug: null,
      notifications: emptyNotifications(),
      emailDeliveriesAfter: [],
      inAppNotificationCount: 0,
      testEmailPolicy,
      resendMessageIds: [],
      logLines,
      error: "Newsletter not found",
    };
  }

  if (newsletter.status !== "PUBLISHED") {
    logLines.push(
      `Warning: newsletter status is ${newsletter.status}. Hub announcements expect a published issue.`,
    );
  }

  const removedFromHub = await removeNewsletterFromMissionHub(newsletter.id);
  logLines.push(
    `Removed from Hub — posts archived: ${removedFromHub.postsArchived}, notifications cleared: ${removedFromHub.notificationsDeleted}, email log cleared: ${removedFromHub.emailDeliveriesDeleted}`,
  );

  const notify = await notifyMissionHubMembersOfNewsletterPublish(newsletter, {
    publisherUserId: input.publisherUserId ?? null,
    resendNewsletterEmail: input.forceResendEmail !== false,
    smokeTest: true,
  });

  const [diagnostics, emailDeliveriesAfter, inAppNotificationCount] = await Promise.all([
    getNewsletterMissionHubDiagnostics(newsletter.id),
    loadEmailDeliveryRows(newsletter.id),
    prisma.communityNotificationRecord.count({
      where: { dedupeKey: newsletterPublishNotificationDedupeKey(newsletter.id) },
    }),
  ]);

  const ministryPost = diagnostics.posts.find((p) => p.spaceSlug === "ministry-updates");
  const newsletterPost = diagnostics.posts.find((p) => p.spaceSlug === "newsletters");

  const resendMessageIds = emailDeliveriesAfter
    .map((r) => r.resendMessageId)
    .filter((id): id is string => Boolean(id));

  logLines.push(`Newsletter slug: ${newsletter.slug}`);
  logLines.push(
    `Ministry Updates post: ${ministryPost?.id ?? "missing"} (${ministryPost?.status ?? "n/a"})`,
  );
  logLines.push(
    `Newsletters space post: ${newsletterPost?.id ?? "missing"} (${newsletterPost?.status ?? "n/a"})`,
  );
  logLines.push(
    `In-app — created: ${notify.notifications.inAppNotificationsSent}, updated: ${notify.notifications.inAppNotificationsUpdated}, total rows: ${inAppNotificationCount}`,
  );
  logLines.push(
    `Email — sent: ${notify.notifications.emailNotificationsSent}, deduped: ${notify.notifications.emailNotificationsDeduped}, failed: ${notify.notifications.emailNotificationsFailed}, skipped: ${notify.notifications.emailNotificationsSkipped ?? 0}`,
  );
  if (resendMessageIds.length > 0) {
    logLines.push(`Resend message ids: ${resendMessageIds.join(", ")}`);
  }
  if (notify.notifications.skippedRecipients?.length) {
    logLines.push(`Skipped recipients (${notify.notifications.skippedRecipients.length}):`);
    for (const s of notify.notifications.skippedRecipients.slice(0, 20)) {
      logLines.push(`  - ${s.userId}${s.email ? ` <${s.email}>` : ""}: ${s.reason}`);
    }
  }

  console.info("[mission-hub-smoke] newsletter hub smoke test\n" + logLines.join("\n"));

  return {
    ok: true,
    newsletterId: newsletter.id,
    newsletterSlug: newsletter.slug,
    newsletterStatus: newsletter.status,
    removedFromHub,
    ministryUpdatesPostId: ministryPost?.id ?? notify.ministryUpdates.postId,
    newsletterSpacePostId: newsletterPost?.id ?? notify.newsletterSpace?.postId ?? null,
    ministryUpdatesSpaceSlug: ministryPost?.spaceSlug ?? notify.ministryUpdates.spaceSlug,
    newsletterSpaceSlug: newsletterPost?.spaceSlug ?? notify.newsletterSpace?.spaceSlug ?? null,
    notifications: notify.notifications,
    emailDeliveriesAfter,
    inAppNotificationCount,
    testEmailPolicy,
    resendMessageIds,
    logLines,
  };
}

function emptyNotifications(): NewsletterPublishNotificationsResult {
  return {
    inAppDelivered: true,
    emailEnabled: false,
    emailDisabledReason: null,
    totalMembersWithAccounts: 0,
    inAppNotificationsSent: 0,
    inAppNotificationsUpdated: 0,
    emailNotificationsSent: 0,
    emailNotificationsDeduped: 0,
    emailNotificationsFailed: 0,
    emailNotificationsSkipped: 0,
    emailSkippedNoAddress: 0,
    emailRecipientsPrepared: 0,
    inAppRecipientsPrepared: 0,
    pushRecipientsPrepared: 0,
    skippedMutedOrDisabled: 0,
    skippedRecipients: [],
    resendMessageIds: [],
  };
}

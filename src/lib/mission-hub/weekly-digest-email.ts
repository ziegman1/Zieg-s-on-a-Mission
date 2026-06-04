import "server-only";

import {
  getMissionHubEmailConfigProblem,
  missionHubEmailDisabledMessage,
} from "@/lib/mission-hub/email-config";
import {
  weeklyDigestEmailDedupeKey,
  weeklyDigestTestEmailDedupeKey,
  weeklyDigestWeekKey,
} from "@/lib/mission-hub/email-dedupe";
import { queueMissionHubEmailDelivery } from "@/lib/mission-hub/email-delivery-queue";
import type { QueueMissionHubEmailResult } from "@/lib/mission-hub/email-delivery-types";
import { absoluteMissionHubUrl } from "@/lib/mission-hub/site-url";
import type { MissionHubEmailSendPolicy } from "@/lib/mission-hub/test-email-recipients";
import type { WeeklyMissionHubDigest } from "@/lib/mission-hub/weekly-digest-core";

export const WEEKLY_DIGEST_EMAIL_SUBJECT = "This Week in Mission Hub";

export type WeeklyDigestEmailContent = {
  subject: string;
  html: string;
  text: string;
  missionHubUrl: string;
  settingsUrl: string;
  dateRangeLabel: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDigestDateRangeLabel(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const opts: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
    year: "numeric",
  };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}

export function buildWeeklyDigestEmailContent(
  digest: WeeklyMissionHubDigest,
): WeeklyDigestEmailContent {
  const missionHubUrl = absoluteMissionHubUrl("/community");
  const settingsUrl = absoluteMissionHubUrl("/community/settings");
  const dateRangeLabel = formatDigestDateRangeLabel(
    digest.dateRange.start,
    digest.dateRange.end,
  );

  const activeSections = digest.sections.filter((section) => section.items.length > 0);

  const textSections = activeSections.map((section) => {
    const lines = section.items.map((item) => {
      const url = absoluteMissionHubUrl(item.href);
      const meta = [item.spaceName, item.authorDisplayName].filter(Boolean).join(" · ");
      const excerpt = item.excerpt ? `\n  ${item.excerpt}` : "";
      return `- ${item.title}${meta ? ` (${meta})` : ""}${excerpt}\n  ${url}`;
    });
    return `${section.title}\n${lines.join("\n")}`;
  });

  const text = [
    WEEKLY_DIGEST_EMAIL_SUBJECT,
    dateRangeLabel,
    "",
    "Here's what happened in Mission Hub this week.",
    "",
    ...textSections,
    "",
    `Open Mission Hub: ${missionHubUrl}`,
    "",
    `Notification preferences: ${settingsUrl}`,
  ].join("\n");

  const htmlSections = activeSections
    .map((section) => {
      const items = section.items
        .map((item) => {
          const url = absoluteMissionHubUrl(item.href);
          const meta = [item.spaceName, item.authorDisplayName].filter(Boolean).join(" · ");
          const excerpt = item.excerpt
            ? `<p style="font-size: 14px; color: #5a5a5a; margin: 4px 0 0;">${escapeHtml(item.excerpt)}</p>`
            : "";
          return `
  <li style="margin: 0 0 14px;">
    <a href="${escapeHtml(url)}" style="font-weight: 600; color: #3d6b8f; text-decoration: none;">${escapeHtml(item.title)}</a>
    ${meta ? `<p style="font-size: 12px; color: #737373; margin: 2px 0 0;">${escapeHtml(meta)}</p>` : ""}
    ${excerpt}
  </li>`;
        })
        .join("");
      return `
  <h2 style="font-size: 16px; margin: 24px 0 10px; color: #1a1a1a;">${escapeHtml(section.title)}</h2>
  <ul style="margin: 0; padding-left: 20px;">${items}</ul>`;
    })
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 13px; color: #737373; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.04em;">Mission Hub</p>
  <h1 style="font-size: 24px; margin: 0 0 8px;">${escapeHtml(WEEKLY_DIGEST_EMAIL_SUBJECT)}</h1>
  <p style="font-size: 14px; color: #5a5a5a; margin: 0 0 20px;">${escapeHtml(dateRangeLabel)}</p>
  <p style="font-size: 16px; margin: 0 0 8px;">Here's what happened in Mission Hub this week.</p>
  ${htmlSections}
  <p style="margin: 28px 0 12px;">
    <a href="${escapeHtml(missionHubUrl)}" style="display: inline-block; background: #5a8fb8; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 999px; font-weight: 600;">Open Mission Hub</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #737373; margin: 0;">
    <a href="${escapeHtml(settingsUrl)}">Manage notification preferences</a> in Mission Hub.
  </p>
</body>
</html>`.trim();

  return {
    subject: WEEKLY_DIGEST_EMAIL_SUBJECT,
    html,
    text,
    missionHubUrl,
    settingsUrl,
    dateRangeLabel,
  };
}

export type QueueWeeklyDigestEmailResult = QueueMissionHubEmailResult;

export async function queueAndSendWeeklyDigestEmail(input: {
  recipientUserId: string;
  recipientEmail: string;
  digest: WeeklyMissionHubDigest;
  forceResend?: boolean;
  testSend?: boolean;
  emailPolicy?: MissionHubEmailSendPolicy;
}): Promise<QueueWeeklyDigestEmailResult> {
  const endDate = new Date(input.digest.dateRange.end);
  const weekKey = weeklyDigestWeekKey(endDate);
  const dedupeKey = input.testSend
    ? weeklyDigestTestEmailDedupeKey(endDate, input.recipientUserId)
    : weeklyDigestEmailDedupeKey(endDate);

  const content = buildWeeklyDigestEmailContent(input.digest);

  return queueMissionHubEmailDelivery(
    {
      recipientUserId: input.recipientUserId,
      recipientEmail: input.recipientEmail,
      notificationKind: "weekly_digest",
      dedupeKey,
      subject: content.subject,
      html: content.html,
      text: content.text,
      metadata: {
        sourceKind: "weekly_digest",
        sourceId: weekKey,
        sourcePostId: "",
        digestWeekKey: weekKey,
        dateRangeStart: input.digest.dateRange.start,
        dateRangeEnd: input.digest.dateRange.end,
        missionHubPostUrl: content.missionHubUrl,
      },
      forceResend: input.forceResend,
    },
    input.emailPolicy ?? { smokeTest: false },
  );
}

export function getWeeklyDigestEmailDisabledReason(): string | null {
  const problem = getMissionHubEmailConfigProblem();
  if (!problem) return null;
  return missionHubEmailDisabledMessage(problem);
}

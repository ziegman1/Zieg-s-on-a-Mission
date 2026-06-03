import "server-only";

import { communityPostAnchorPath } from "@/lib/community/post-url";
import { urgentPrayerPublishEmailDedupeKey } from "@/lib/mission-hub/email-dedupe";
import { isMissionHubAdvancedNotificationsEnabled } from "@/lib/mission-hub/advanced-notifications-config";
import { queueMissionHubEmailDelivery } from "@/lib/mission-hub/email-delivery-queue";
import type { QueueMissionHubEmailResult } from "@/lib/mission-hub/email-delivery-types";
import type { MissionHubEmailSendPolicy } from "@/lib/mission-hub/test-email-recipients";
import { absoluteMissionHubUrl } from "@/lib/mission-hub/site-url";

export const URGENT_PRAYER_EMAIL_SUBJECT =
  "Urgent Prayer Request from Jeremy & Lindsay";

export type UrgentPrayerEmailContent = {
  subject: string;
  html: string;
  text: string;
  postUrl: string;
  settingsUrl: string;
};

function firstLine(body: string): string {
  const line = body.split("\n").map((l) => l.trim()).find(Boolean);
  return line ?? "";
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildUrgentPrayerEmailContent(input: {
  spaceSlug: string;
  postId: string;
  title: string | null;
  body: string;
  excerpt: string | null;
}): UrgentPrayerEmailContent {
  const postPath = communityPostAnchorPath(input.spaceSlug, input.postId);
  const postUrl = absoluteMissionHubUrl(postPath);
  const settingsUrl = absoluteMissionHubUrl("/community/settings");
  const headline = input.title?.trim() || "Urgent prayer request";
  const preview =
    input.excerpt?.trim() ||
    truncate(input.body.trim(), 280) ||
    firstLine(input.body) ||
    "We are asking for your prayers.";

  const text = [
    URGENT_PRAYER_EMAIL_SUBJECT,
    "",
    headline,
    "",
    preview,
    "",
    "Open Mission Hub to pray with us.",
    "",
    "You can leave a written prayer or record a voice prayer so we know you are praying with us.",
    "",
    `Open prayer request: ${postUrl}`,
    "",
    `Notification preferences: ${settingsUrl}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 14px; color: #5a5a5a; margin: 0 0 16px;">${escapeHtml(URGENT_PRAYER_EMAIL_SUBJECT)}</p>
  <h1 style="font-size: 20px; margin: 0 0 12px;">${escapeHtml(headline)}</h1>
  <p style="font-size: 16px; margin: 0 0 16px;">${escapeHtml(preview)}</p>
  <p style="font-size: 15px; margin: 0 0 8px; font-weight: 600;">Open Mission Hub to pray with us</p>
  <p style="font-size: 14px; margin: 0 0 24px; color: #444;">You can leave a written prayer or record a voice prayer so we know you are praying with us.</p>
  <p style="margin: 0 0 24px;">
    <a href="${escapeHtml(postUrl)}" style="display: inline-block; background: #5a8fb8; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 999px; font-weight: 600;">Open Prayer Request</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #737373; margin: 0;">
    <a href="${escapeHtml(settingsUrl)}">Manage notification preferences</a> in Mission Hub.
  </p>
</body>
</html>`.trim();

  return { subject: URGENT_PRAYER_EMAIL_SUBJECT, html, text, postUrl, settingsUrl };
}

export async function queueAndSendUrgentPrayerEmail(input: {
  recipientUserId: string;
  recipientEmail: string;
  postId: string;
  spaceId: string;
  spaceSlug: string;
  title: string | null;
  body: string;
  excerpt: string | null;
  forceResend?: boolean;
  emailPolicy?: MissionHubEmailSendPolicy;
}): Promise<QueueMissionHubEmailResult> {
  if (!isMissionHubAdvancedNotificationsEnabled()) {
    return { action: "skipped", reason: "advanced_notifications_disabled" };
  }

  const content = buildUrgentPrayerEmailContent({
    spaceSlug: input.spaceSlug,
    postId: input.postId,
    title: input.title,
    body: input.body,
    excerpt: input.excerpt,
  });

  return queueMissionHubEmailDelivery(
    {
      recipientUserId: input.recipientUserId,
      recipientEmail: input.recipientEmail,
      notificationKind: "urgent_prayer_request",
      dedupeKey: urgentPrayerPublishEmailDedupeKey(input.postId),
      subject: content.subject,
      html: content.html,
      text: content.text,
      metadata: {
        sourceKind: "post",
        sourceId: input.postId,
        sourcePostId: input.postId,
        spaceId: input.spaceId,
        spaceSlug: input.spaceSlug,
        missionHubPostUrl: content.postUrl,
      },
      forceResend: input.forceResend,
    },
    input.emailPolicy ?? { smokeTest: false },
  );
}

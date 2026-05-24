import "server-only";

import { communityPostAnchorPath } from "@/lib/community/post-url";
import { postPublishEmailDedupeKey } from "@/lib/mission-hub/email-dedupe";
import { queueMissionHubEmailDelivery } from "@/lib/mission-hub/email-delivery-queue";
import type { QueueMissionHubEmailResult } from "@/lib/mission-hub/email-delivery-types";
import type { MissionHubEmailSendPolicy } from "@/lib/mission-hub/test-email-recipients";
import { absoluteMissionHubUrl } from "@/lib/mission-hub/site-url";

export function buildPostPublishEmailSubject(spaceName: string): string {
  return `New post in ${spaceName.trim() || "Mission Hub"}`;
}

export type PostPublishEmailContent = {
  subject: string;
  html: string;
  text: string;
  postUrl: string;
  settingsUrl: string;
};

export function buildPostPublishEmailContent(input: {
  spaceName: string;
  spaceSlug: string;
  postId: string;
  title: string | null;
  body: string;
  excerpt: string | null;
}): PostPublishEmailContent {
  const postPath = communityPostAnchorPath(input.spaceSlug, input.postId);
  const postUrl = absoluteMissionHubUrl(postPath);
  const settingsUrl = absoluteMissionHubUrl("/community/settings");
  const headline = input.title?.trim() || firstLine(input.body) || "New update";
  const excerpt =
    input.excerpt?.trim() ||
    truncate(input.body.trim(), 200) ||
    "A new post was shared in Mission Hub.";

  const subject = buildPostPublishEmailSubject(input.spaceName);

  const text = [
    subject,
    "",
    headline,
    "",
    excerpt,
    "",
    `View post: ${postUrl}`,
    "",
    `Notification preferences: ${settingsUrl}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 14px; color: #5a5a5a; margin: 0 0 16px;">${escapeHtml(subject)}</p>
  <h1 style="font-size: 20px; margin: 0 0 12px;">${escapeHtml(headline)}</h1>
  <p style="font-size: 16px; margin: 0 0 24px;">${escapeHtml(excerpt)}</p>
  <p style="margin: 0 0 24px;">
    <a href="${escapeHtml(postUrl)}" style="display: inline-block; background: #5a8fb8; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 999px; font-weight: 600;">View in Mission Hub</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #737373; margin: 0;">
    <a href="${escapeHtml(settingsUrl)}">Manage notification preferences</a>
  </p>
</body>
</html>`.trim();

  return { subject, html, text, postUrl, settingsUrl };
}

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

export async function queueAndSendPostPublishEmail(input: {
  recipientUserId: string;
  recipientEmail: string;
  postId: string;
  spaceId: string;
  spaceSlug: string;
  spaceName: string;
  title: string | null;
  body: string;
  excerpt: string | null;
  forceResend?: boolean;
  emailPolicy?: MissionHubEmailSendPolicy;
}): Promise<QueueMissionHubEmailResult> {
  const content = buildPostPublishEmailContent({
    spaceName: input.spaceName,
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
      notificationKind: "post_published",
      dedupeKey: postPublishEmailDedupeKey(input.postId),
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

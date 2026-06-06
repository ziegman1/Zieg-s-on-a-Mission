import "server-only";

import type { NewsletterRecord } from "@/lib/newsletter/types";
import {
  getMissionHubEmailConfigProblem,
  missionHubEmailDisabledMessage,
} from "@/lib/mission-hub/email-config";
import { newsletterPublishEmailDedupeKey } from "@/lib/mission-hub/email-dedupe";
import { queueMissionHubEmailDelivery } from "@/lib/mission-hub/email-delivery-queue";
import type { QueueMissionHubEmailResult } from "@/lib/mission-hub/email-delivery-types";
import type { MissionHubEmailSendPolicy } from "@/lib/mission-hub/test-email-recipients";
import {
  NEWSLETTER_SPACE_SLUG,
  newsletterPublicPath,
} from "@/lib/newsletter/mission-hub-announcement";
import { absoluteMissionHubUrl } from "@/lib/mission-hub/site-url";
import { finalizeMissionHubEmailContent } from "@/lib/mission-hub/email-compliance-footer";

export const NEWSLETTER_PUBLISH_EMAIL_SUBJECT = "New newsletter from Zieg's on a Mission";

export type NewsletterPublishEmailContent = {
  subject: string;
  html: string;
  text: string;
  newsletterPublicUrl: string;
  missionHubPostUrl: string;
  settingsUrl: string;
};

export function buildNewsletterPublishEmailContent(input: {
  newsletter: Pick<NewsletterRecord, "title" | "slug" | "excerpt" | "subtitle">;
  missionHubPostUrl: string;
}): NewsletterPublishEmailContent {
  const newsletterPublicUrl = absoluteMissionHubUrl(newsletterPublicPath(input.newsletter.slug));
  const settingsUrl = absoluteMissionHubUrl("/community/settings");
  const title = input.newsletter.title.trim() || "Newsletter";
  const excerpt =
    input.newsletter.excerpt.trim() ||
    input.newsletter.subtitle.trim() ||
    "A new ministry update is available.";

  const text = [
    NEWSLETTER_PUBLISH_EMAIL_SUBJECT,
    "",
    title,
    "",
    excerpt,
    "",
    `Read the newsletter: ${newsletterPublicUrl}`,
    `View in Mission Hub: ${input.missionHubPostUrl}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 14px; color: #5a5a5a; margin: 0 0 16px;">${escapeHtml(NEWSLETTER_PUBLISH_EMAIL_SUBJECT)}</p>
  <h1 style="font-size: 22px; margin: 0 0 12px;">${escapeHtml(title)}</h1>
  <p style="font-size: 16px; margin: 0 0 24px;">${escapeHtml(excerpt)}</p>
  <p style="margin: 0 0 12px;">
    <a href="${escapeHtml(newsletterPublicUrl)}" style="display: inline-block; background: #5a8fb8; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 999px; font-weight: 600;">Read newsletter</a>
  </p>
  <p style="margin: 0 0 24px; font-size: 14px;">
    <a href="${escapeHtml(input.missionHubPostUrl)}">View in Mission Hub (${NEWSLETTER_SPACE_SLUG})</a>
  </p>
</body>
</html>`.trim();

  return {
    subject: NEWSLETTER_PUBLISH_EMAIL_SUBJECT,
    html,
    text,
    newsletterPublicUrl,
    missionHubPostUrl: input.missionHubPostUrl,
    settingsUrl,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type QueueNewsletterEmailResult = QueueMissionHubEmailResult;

export async function queueAndSendNewsletterPublishEmail(input: {
  recipientUserId: string;
  recipientEmail: string;
  newsletter: NewsletterRecord;
  missionHubPostUrl: string;
  forceResend?: boolean;
  emailPolicy?: MissionHubEmailSendPolicy;
}): Promise<QueueNewsletterEmailResult> {
  const built = buildNewsletterPublishEmailContent({
    newsletter: input.newsletter,
    missionHubPostUrl: input.missionHubPostUrl,
  });
  const content = finalizeMissionHubEmailContent({
    ...built,
    recipientUserId: input.recipientUserId,
    recipientEmail: input.recipientEmail,
  });

  return queueMissionHubEmailDelivery(
    {
      recipientUserId: input.recipientUserId,
      recipientEmail: input.recipientEmail,
      notificationKind: "newsletter_published",
      dedupeKey: newsletterPublishEmailDedupeKey(input.newsletter.id),
      subject: content.subject,
      html: content.html,
      text: content.text,
      metadata: {
        sourceKind: "newsletter",
        sourceId: input.newsletter.id,
        sourcePostId: extractPostIdFromMissionHubUrl(input.missionHubPostUrl),
        newsletterSlug: input.newsletter.slug,
        newsletterPublicUrl: built.newsletterPublicUrl,
        missionHubPostUrl: built.missionHubPostUrl,
      },
      forceResend: input.forceResend,
    },
    input.emailPolicy ?? { smokeTest: false },
  );
}

function extractPostIdFromMissionHubUrl(url: string): string {
  const hash = url.split("#post-")[1];
  return hash?.trim() || "";
}

export function getNewsletterPublishEmailDisabledReason(): string | null {
  const problem = getMissionHubEmailConfigProblem();
  if (!problem) return null;
  return missionHubEmailDisabledMessage(problem);
}

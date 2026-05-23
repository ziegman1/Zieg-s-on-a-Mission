import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  NEWSLETTER_SPACE_SLUG,
  newsletterPublicPath,
} from "@/lib/newsletter/mission-hub-announcement";
import type { NewsletterRecord } from "@/lib/newsletter/types";
import {
  getMissionHubEmailConfigProblem,
  missionHubEmailDisabledMessage,
} from "@/lib/mission-hub/email-config";
import { newsletterPublishEmailDedupeKey } from "@/lib/mission-hub/email-dedupe";
import { sendMissionHubEmail } from "@/lib/mission-hub/resend-client";
import { absoluteMissionHubUrl } from "@/lib/mission-hub/site-url";

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
    "",
    `Notification preferences: ${settingsUrl}`,
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
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #737373; margin: 0;">
    <a href="${escapeHtml(settingsUrl)}">Manage notification preferences</a> in Mission Hub.
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

export type QueueNewsletterEmailResult =
  | { action: "sent"; deliveryId: string }
  | { action: "deduped" }
  | { action: "failed"; deliveryId: string; error: string };

export async function queueAndSendNewsletterPublishEmail(input: {
  recipientUserId: string;
  recipientEmail: string;
  newsletter: NewsletterRecord;
  missionHubPostUrl: string;
  forceResend?: boolean;
}): Promise<QueueNewsletterEmailResult> {
  const dedupeKey = newsletterPublishEmailDedupeKey(input.newsletter.id);
  const existing = await prisma.missionHubEmailDeliveryRecord.findUnique({
    where: {
      recipientUserId_dedupeKey: {
        recipientUserId: input.recipientUserId,
        dedupeKey,
      },
    },
  });

  if (existing?.status === "sent" && !input.forceResend) {
    return { action: "deduped" };
  }

  const content = buildNewsletterPublishEmailContent({
    newsletter: input.newsletter,
    missionHubPostUrl: input.missionHubPostUrl,
  });

  const metadata = {
    newsletterId: input.newsletter.id,
    newsletterSlug: input.newsletter.slug,
    newsletterPublicUrl: content.newsletterPublicUrl,
    missionHubPostUrl: content.missionHubPostUrl,
  } satisfies Prisma.InputJsonValue;

  const delivery =
    existing && input.forceResend
      ? await prisma.missionHubEmailDeliveryRecord.update({
          where: { id: existing.id },
          data: {
            recipientEmail: input.recipientEmail,
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
              notificationKind: "newsletter_published",
              dedupeKey,
              status: "pending",
              metadata,
            },
          });

  const sendResult = await sendMissionHubEmail({
    to: input.recipientEmail,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  if (!sendResult.ok) {
    await prisma.missionHubEmailDeliveryRecord.update({
      where: { id: delivery.id },
      data: {
        status: "failed",
        errorMessage: sendResult.error,
      },
    });
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

  return { action: "sent", deliveryId: delivery.id };
}

export function getNewsletterPublishEmailDisabledReason(): string | null {
  const problem = getMissionHubEmailConfigProblem();
  if (!problem) return null;
  return missionHubEmailDisabledMessage(problem);
}

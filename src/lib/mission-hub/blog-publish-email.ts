import "server-only";

import type { BlogPostRecord } from "@/lib/blog/types";
import {
  BLOG_ARTICLES_SPACE_SLUG,
  blogPublicPath,
} from "@/lib/blog/mission-hub-announcement";
import {
  getMissionHubEmailConfigProblem,
  missionHubEmailDisabledMessage,
} from "@/lib/mission-hub/email-config";
import { isMissionHubAdvancedNotificationsEnabled } from "@/lib/mission-hub/advanced-notifications-config";
import { blogPublishEmailDedupeKey } from "@/lib/mission-hub/email-dedupe";
import { queueMissionHubEmailDelivery } from "@/lib/mission-hub/email-delivery-queue";
import type { QueueMissionHubEmailResult } from "@/lib/mission-hub/email-delivery-types";
import type { MissionHubEmailSendPolicy } from "@/lib/mission-hub/test-email-recipients";
import { absoluteMissionHubUrl } from "@/lib/mission-hub/site-url";

export const BLOG_PUBLISH_EMAIL_SUBJECT = "New blog article from Zieg's on a Mission";

export type BlogPublishEmailContent = {
  subject: string;
  html: string;
  text: string;
  blogPublicUrl: string;
  missionHubPostUrl: string;
  settingsUrl: string;
};

export function buildBlogPublishEmailContent(input: {
  blog: Pick<BlogPostRecord, "title" | "slug" | "excerpt" | "body">;
  missionHubPostUrl: string;
}): BlogPublishEmailContent {
  const blogPublicUrl = absoluteMissionHubUrl(blogPublicPath(input.blog.slug));
  const settingsUrl = absoluteMissionHubUrl("/community/settings");
  const title = input.blog.title.trim() || "Blog article";
  const excerpt =
    input.blog.excerpt.trim() ||
    input.blog.body.trim().split(/\n\n+/)[0]?.trim().slice(0, 280) ||
    "A new blog article is available.";

  const text = [
    BLOG_PUBLISH_EMAIL_SUBJECT,
    "",
    title,
    "",
    excerpt,
    "",
    `Read the article: ${blogPublicUrl}`,
    `View in Mission Hub: ${input.missionHubPostUrl}`,
    "",
    `Notification preferences: ${settingsUrl}`,
  ].join("\n");

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Georgia, 'Times New Roman', serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <p style="font-size: 14px; color: #5a5a5a; margin: 0 0 16px;">${escapeHtml(BLOG_PUBLISH_EMAIL_SUBJECT)}</p>
  <h1 style="font-size: 22px; margin: 0 0 12px;">${escapeHtml(title)}</h1>
  <p style="font-size: 16px; margin: 0 0 24px;">${escapeHtml(excerpt)}</p>
  <p style="margin: 0 0 12px;">
    <a href="${escapeHtml(blogPublicUrl)}" style="display: inline-block; background: #5a8fb8; color: #fff; text-decoration: none; padding: 12px 20px; border-radius: 999px; font-weight: 600;">Read article</a>
  </p>
  <p style="margin: 0 0 24px; font-size: 14px;">
    <a href="${escapeHtml(input.missionHubPostUrl)}">View in Mission Hub (${BLOG_ARTICLES_SPACE_SLUG})</a>
  </p>
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;" />
  <p style="font-size: 12px; color: #737373; margin: 0;">
    <a href="${escapeHtml(settingsUrl)}">Manage notification preferences</a> in Mission Hub.
  </p>
</body>
</html>`.trim();

  return {
    subject: BLOG_PUBLISH_EMAIL_SUBJECT,
    html,
    text,
    blogPublicUrl,
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

export type QueueBlogEmailResult = QueueMissionHubEmailResult;

export async function queueAndSendBlogPublishEmail(input: {
  recipientUserId: string;
  recipientEmail: string;
  blog: BlogPostRecord;
  missionHubPostUrl: string;
  forceResend?: boolean;
  emailPolicy?: MissionHubEmailSendPolicy;
}): Promise<QueueBlogEmailResult> {
  if (!isMissionHubAdvancedNotificationsEnabled()) {
    return { action: "skipped", reason: "advanced_notifications_disabled" };
  }

  const content = buildBlogPublishEmailContent({
    blog: input.blog,
    missionHubPostUrl: input.missionHubPostUrl,
  });

  return queueMissionHubEmailDelivery(
    {
      recipientUserId: input.recipientUserId,
      recipientEmail: input.recipientEmail,
      notificationKind: "blog_published",
      dedupeKey: blogPublishEmailDedupeKey(input.blog.id),
      subject: content.subject,
      html: content.html,
      text: content.text,
      metadata: {
        sourceKind: "blog",
        sourceId: input.blog.id,
        sourcePostId: extractPostIdFromMissionHubUrl(input.missionHubPostUrl),
        blogSlug: input.blog.slug,
        blogPublicUrl: content.blogPublicUrl,
        missionHubPostUrl: content.missionHubPostUrl,
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

export function getBlogPublishEmailDisabledReason(): string | null {
  const problem = getMissionHubEmailConfigProblem();
  if (!problem) return null;
  return missionHubEmailDisabledMessage(problem);
}

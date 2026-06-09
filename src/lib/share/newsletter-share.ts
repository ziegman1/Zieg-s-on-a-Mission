import { missionHubSiteOrigin } from "@/lib/community/invite";
import { newsletterPublicPath } from "@/lib/newsletter/mission-hub-announcement";
import {
  buildShareCopyLinkValue,
  buildShareMailtoLink,
  buildShareSmsDeepLink,
} from "./share-content";

export const NEWSLETTER_SHARE_SMS_INTRO =
  "Hey! I wanted to share our latest ministry update with you.";

export function buildAbsoluteNewsletterShareUrl(slug: string, origin?: string): string {
  const path = newsletterPublicPath(slug);
  return `${missionHubSiteOrigin(origin)}${path}`;
}

export function buildNewsletterShareMessage(input: {
  title: string;
  slug: string;
  origin?: string;
}): string {
  const title = input.title.trim() || "Ministry update";
  const url = buildAbsoluteNewsletterShareUrl(input.slug, input.origin);
  return [NEWSLETTER_SHARE_SMS_INTRO, "", title, "", "Read it here:", url].join("\n");
}

export function buildNewsletterShareCopyLinkValue(input: {
  slug: string;
  origin?: string;
}): string {
  return buildShareCopyLinkValue(buildAbsoluteNewsletterShareUrl(input.slug, input.origin));
}

export function buildNewsletterShareSmsDeepLink(input: {
  title: string;
  slug: string;
  origin?: string;
}): string {
  return buildShareSmsDeepLink(buildNewsletterShareMessage(input));
}

export function buildNewsletterShareMailtoLink(input: {
  title: string;
  slug: string;
  origin?: string;
}): string {
  return buildShareMailtoLink({
    subject: input.title.trim() || "Ministry update",
    body: buildNewsletterShareMessage(input),
  });
}

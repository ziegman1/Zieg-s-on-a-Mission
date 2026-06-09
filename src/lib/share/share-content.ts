import { FACEBOOK_SHARER_BASE } from "@/lib/community/post-public-share";

export function buildShareCopyLinkValue(absoluteUrl: string): string {
  return absoluteUrl.trim();
}

export function buildShareSmsDeepLink(body: string): string {
  return `sms:?&body=${encodeURIComponent(body)}`;
}

export function buildShareMailtoLink(input: { subject: string; body: string }): string {
  const subject = encodeURIComponent(input.subject.trim() || "Ministry update");
  const body = encodeURIComponent(input.body);
  return `mailto:?subject=${subject}&body=${body}`;
}

export function buildFacebookShareUrl(shareUrl: string): string {
  return `${FACEBOOK_SHARER_BASE}?u=${encodeURIComponent(shareUrl.trim())}`;
}

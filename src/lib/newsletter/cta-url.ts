/** User-facing message for invalid newsletter / CTA link fields. */
export const NEWSLETTER_LINK_URL_ERROR =
  "Enter a valid URL beginning with https:// or a site path beginning with /.";

const BLOCKED_PROTOCOL_PREFIXES = ["javascript:", "data:", "vbscript:"] as const;

/** Trim and strip common invisible characters from pasted URLs. */
export function normalizeNewsletterLinkUrl(value: string): string {
  return value
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
}

function hasBlockedProtocol(value: string): boolean {
  const lower = value.toLowerCase();
  return BLOCKED_PROTOCOL_PREFIXES.some((p) => lower.startsWith(p));
}

function isValidSitePath(path: string): boolean {
  if (path === "/") return true;
  if (path.startsWith("//")) return false;
  if (/\s/.test(path)) return false;
  if (path.includes("://")) return false;
  return /^\/[^\s]*$/.test(path);
}

function isValidAbsoluteHttpUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;
  try {
    const u = new URL(value);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    if (!u.hostname) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Valid link targets for newsletter CTAs and button blocks.
 * Empty string is valid (optional field).
 */
export function isValidNewsletterLinkUrl(url: string): boolean {
  const t = normalizeNewsletterLinkUrl(url);
  if (!t) return true;
  if (hasBlockedProtocol(t)) return false;
  if (t.startsWith("/")) return isValidSitePath(t);
  return isValidAbsoluteHttpUrl(t);
}

/** Returns an error message when invalid, or null when valid / empty. */
export function validateNewsletterLinkUrl(url: string): string | null {
  if (!normalizeNewsletterLinkUrl(url)) return null;
  return isValidNewsletterLinkUrl(url) ? null : NEWSLETTER_LINK_URL_ERROR;
}

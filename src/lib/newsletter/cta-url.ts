/** User-facing message for invalid newsletter / CTA link fields. */
export const NEWSLETTER_LINK_URL_ERROR =
  "Enter a valid URL beginning with https:// or a site path beginning with /.";

export const PDF_UPLOAD_REQUIRED_MESSAGE =
  "Upload this PDF before using it as a button link.";

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
  if (isUnhostedPdfReference(t)) return false;
  if (hasBlockedProtocol(t)) return false;
  if (t.startsWith("/")) return isValidSitePath(t);
  return isValidAbsoluteHttpUrl(t);
}

function isLocalFileNewsletterUrl(url: string): boolean {
  if (/^file:/i.test(url)) return true;
  try {
    return new URL(url).protocol === "file:";
  } catch {
    return false;
  }
}

function decodeUrlSafe(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** Bare filename, encoded filename, Windows path, or file:// — not https or /site paths. */
export function isUnhostedPdfReference(value: string): boolean {
  const t = normalizeNewsletterLinkUrl(value);
  if (!t) return false;

  const decoded = decodeUrlSafe(t);

  if (isLocalFileNewsletterUrl(t)) return true;
  if (/^[a-zA-Z]:[\\/]/.test(t)) return true;
  if (t.includes("\\")) return true;
  if (/^\/(?:Users|home|private|var|tmp)\//i.test(t)) return true;

  if (t.startsWith("/") && !t.startsWith("//")) {
    return false;
  }

  if (/^https?:\/\//i.test(t)) {
    return false;
  }

  if (/\.pdf$/i.test(decoded) || /\.pdf$/i.test(t)) {
    return true;
  }

  if (!t.includes("/") && !t.includes("://") && /\.pdf/i.test(t)) {
    return true;
  }

  return false;
}

/** Returns an error message when invalid, or null when valid / empty. */
export function validateNewsletterLinkUrl(url: string): string | null {
  const t = normalizeNewsletterLinkUrl(url);
  if (!t) return null;
  if (isLocalFileNewsletterUrl(t)) {
    return "Local files must be uploaded before they can be used in newsletters.";
  }
  if (isUnhostedPdfReference(t)) {
    return PDF_UPLOAD_REQUIRED_MESSAGE;
  }
  return isValidNewsletterLinkUrl(t) ? null : NEWSLETTER_LINK_URL_ERROR;
}

export { isLocalFileNewsletterUrl };

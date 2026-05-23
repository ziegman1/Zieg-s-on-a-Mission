import {
  isLocalFileNewsletterUrl,
  isValidNewsletterLinkUrl,
  normalizeNewsletterLinkUrl,
  NEWSLETTER_LINK_URL_ERROR,
} from "@/lib/newsletter/cta-url";

export const LOCAL_FILE_NEWSLETTER_URL_ERROR =
  "Local files must be uploaded before they can be used in newsletters.";

export { isLocalFileNewsletterUrl };

/** Hosted http(s) or site path — rejects file:// and other invalid URLs. */
export function isValidNewsletterDocumentUrl(url: string): boolean {
  const t = normalizeNewsletterLinkUrl(url);
  if (!t) return false;
  if (isLocalFileNewsletterUrl(t)) return false;
  return isValidNewsletterLinkUrl(t);
}

export function validateNewsletterDocumentUrl(url: string): string | null {
  const t = normalizeNewsletterLinkUrl(url);
  if (!t) return "Document URL is required.";
  if (isLocalFileNewsletterUrl(t)) return LOCAL_FILE_NEWSLETTER_URL_ERROR;
  if (!isValidNewsletterLinkUrl(t)) return NEWSLETTER_LINK_URL_ERROR;
  return null;
}

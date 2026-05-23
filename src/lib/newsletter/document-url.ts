import { isLocalFileNewsletterUrl, normalizeNewsletterLinkUrl, NEWSLETTER_LINK_URL_ERROR } from "@/lib/newsletter/cta-url";
import {
  isValidNewsletterPdfLinkUrl,
  isUnhostedPdfReference,
  LOCAL_FILE_NEWSLETTER_URL_ERROR,
  PDF_UPLOAD_REQUIRED_MESSAGE,
} from "@/lib/newsletter/pdf-link-url";

export { isLocalFileNewsletterUrl, LOCAL_FILE_NEWSLETTER_URL_ERROR, PDF_UPLOAD_REQUIRED_MESSAGE };

/** Hosted http(s) or site path — rejects file:// and unhosted PDF filenames. */
export function isValidNewsletterDocumentUrl(url: string): boolean {
  return isValidNewsletterPdfLinkUrl(url);
}

export function validateNewsletterDocumentUrl(url: string): string | null {
  const t = normalizeNewsletterLinkUrl(url);
  if (!t) return "Document URL is required.";
  if (isUnhostedPdfReference(t)) {
    return isLocalFileNewsletterUrl(t)
      ? LOCAL_FILE_NEWSLETTER_URL_ERROR
      : PDF_UPLOAD_REQUIRED_MESSAGE;
  }
  return isValidNewsletterPdfLinkUrl(t) ? null : NEWSLETTER_LINK_URL_ERROR;
}

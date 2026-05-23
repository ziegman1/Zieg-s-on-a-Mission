import {
  isLocalFileNewsletterUrl,
  isUnhostedPdfReference,
  isValidNewsletterLinkUrl,
  normalizeNewsletterLinkUrl,
  NEWSLETTER_LINK_URL_ERROR,
  PDF_UPLOAD_REQUIRED_MESSAGE,
} from "@/lib/newsletter/cta-url";

export {
  isLocalFileNewsletterUrl,
  isUnhostedPdfReference,
  PDF_UPLOAD_REQUIRED_MESSAGE,
};

export const LOCAL_FILE_NEWSLETTER_URL_ERROR =
  "Local files must be uploaded before they can be used in newsletters.";

export function isValidNewsletterPdfLinkUrl(url: string): boolean {
  const t = normalizeNewsletterLinkUrl(url);
  if (!t) return false;
  if (isUnhostedPdfReference(t)) return false;
  return isValidNewsletterLinkUrl(t);
}

export function validateNewsletterPdfLinkUrl(url: string): string | null {
  const t = normalizeNewsletterLinkUrl(url);
  if (!t) return null;
  if (isLocalFileNewsletterUrl(t)) return LOCAL_FILE_NEWSLETTER_URL_ERROR;
  if (isUnhostedPdfReference(t)) return PDF_UPLOAD_REQUIRED_MESSAGE;
  return isValidNewsletterLinkUrl(t) ? null : NEWSLETTER_LINK_URL_ERROR;
}

/** Display name for an uploaded or pasted PDF link. */
export function pdfLinkDisplayName(url: string): string {
  const t = normalizeNewsletterLinkUrl(url);
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) {
    try {
      const path = new URL(t).pathname;
      const segment = path.split("/").filter(Boolean).pop();
      return segment ? decodeURIComponent(segment) : "PDF";
    } catch {
      return "PDF";
    }
  }
  try {
    return decodeURIComponent(t.split(/[/\\]/).pop() ?? t);
  } catch {
    return t.split(/[/\\]/).pop() ?? t;
  }
}

export function needsPdfUploadBeforeUse(url: string): boolean {
  return isUnhostedPdfReference(url);
}

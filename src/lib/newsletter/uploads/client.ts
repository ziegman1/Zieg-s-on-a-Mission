/**
 * Client-safe newsletter upload helpers (fetch to admin APIs only).
 */
export {
  NEWSLETTER_PDF_ACCEPT,
  NEWSLETTER_PDF_MAX_BYTES,
  validateNewsletterPdfFile,
  uploadNewsletterDocumentFile,
  type NewsletterDocumentUploadResult,
} from "@/lib/newsletter/document-upload";

export {
  NEWSLETTER_IMAGE_ACCEPT,
  validateNewsletterImageFile,
  isLikelyImageUrl,
  uploadNewsletterImageFile,
  type NewsletterImageUploadResult,
  type NewsletterImagePurpose,
} from "@/lib/newsletter/media-upload";

export {
  parseNewsletterUploadApiError,
  UNAUTHORIZED_UPLOAD_MESSAGE,
} from "@/lib/newsletter/newsletter-upload-errors-client";

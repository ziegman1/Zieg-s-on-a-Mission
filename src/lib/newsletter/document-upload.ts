import {
  parseNewsletterUploadApiError,
  UNAUTHORIZED_UPLOAD_MESSAGE,
} from "./newsletter-upload-errors-client";

export const NEWSLETTER_PDF_ACCEPT = "application/pdf,.pdf";

export const NEWSLETTER_PDF_MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export function validateNewsletterPdfFile(file: File): string | null {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return "Use a PDF file.";
  }
  if (file.size > NEWSLETTER_PDF_MAX_BYTES) {
    return "PDF must be 20 MB or smaller.";
  }
  if (file.size < 1) {
    return "PDF file is empty.";
  }
  return null;
}

export type NewsletterDocumentUploadResult = {
  url: string;
  path?: string;
  storage?: string;
};

export async function uploadNewsletterDocumentFile(
  file: File,
  options?: { newsletterId?: string },
): Promise<NewsletterDocumentUploadResult> {
  const validationError = validateNewsletterPdfFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const fd = new FormData();
  fd.append("file", file);
  if (options?.newsletterId?.trim()) {
    fd.append("newsletterId", options.newsletterId.trim());
  }

  const res = await fetch("/api/admin/upload-newsletter-document", {
    method: "POST",
    body: fd,
  });

  const text = await res.text();
  let data: { url?: string; path?: string; storage?: string; error?: string; detail?: string } = {};
  try {
    data = text ? (JSON.parse(text) as typeof data) : {};
  } catch {
    if (process.env.NODE_ENV === "development" && text) {
      throw new Error(
        `Upload failed: invalid JSON response (${res.status}): ${text.slice(0, 240)}`,
      );
    }
    throw new Error(parseNewsletterUploadApiError(res.status, null, "pdf"));
  }

  if (res.status === 401) {
    throw new Error(UNAUTHORIZED_UPLOAD_MESSAGE);
  }
  if (!res.ok || !data.url) {
    throw new Error(parseNewsletterUploadApiError(res.status, data, "pdf"));
  }

  return { url: data.url, path: data.path, storage: data.storage };
}

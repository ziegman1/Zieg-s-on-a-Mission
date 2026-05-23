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

  const data = (await res.json()) as { url?: string; path?: string; storage?: string; error?: string };
  if (res.status === 401) {
    throw new Error("Upload failed. Sign in as an admin.");
  }
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed.");
  }

  return { url: data.url, path: data.path, storage: data.storage };
}

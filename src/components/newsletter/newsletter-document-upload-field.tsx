"use client";

import { NewsletterPdfLinkField } from "@/components/newsletter/newsletter-pdf-link-field";

export function NewsletterDocumentUploadField({
  documentUrl,
  onDocumentUrlChange,
  newsletterId,
  disabled = false,
}: {
  documentUrl: string;
  onDocumentUrlChange: (url: string) => void;
  newsletterId?: string;
  disabled?: boolean;
}) {
  return (
    <NewsletterPdfLinkField
      url={documentUrl}
      onUrlChange={onDocumentUrlChange}
      newsletterId={newsletterId}
      disabled={disabled}
      variant="full"
      urlLabel="Or paste public document URL (optional)"
      helpText="Upload a PDF from your computer or paste a public https:// URL. Local file paths are not supported."
      testId="newsletter-document-upload"
    />
  );
}

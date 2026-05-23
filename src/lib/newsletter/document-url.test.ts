import { describe, expect, it } from "vitest";
import {
  LOCAL_FILE_NEWSLETTER_URL_ERROR,
  validateNewsletterDocumentUrl,
} from "./document-url";

describe("validateNewsletterDocumentUrl", () => {
  it("rejects file:// pasted URLs with a clear message", () => {
    expect(validateNewsletterDocumentUrl("file:///Users/me/report.pdf")).toBe(
      LOCAL_FILE_NEWSLETTER_URL_ERROR,
    );
    expect(validateNewsletterDocumentUrl("file://C:/docs/guide.pdf")).toBe(
      LOCAL_FILE_NEWSLETTER_URL_ERROR,
    );
  });

  it("accepts hosted https URLs", () => {
    expect(
      validateNewsletterDocumentUrl(
        "https://testref.supabase.co/storage/v1/object/public/newsletter-assets/temp/documents/abc.pdf",
      ),
    ).toBeNull();
  });
});

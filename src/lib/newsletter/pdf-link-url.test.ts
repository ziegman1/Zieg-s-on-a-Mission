import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  isUnhostedPdfReference,
  isValidNewsletterPdfLinkUrl,
  needsPdfUploadBeforeUse,
  validateNewsletterPdfLinkUrl,
  PDF_UPLOAD_REQUIRED_MESSAGE,
} from "./pdf-link-url";
import { uploadNewsletterDocumentFile } from "./document-upload";

describe("isUnhostedPdfReference", () => {
  it("detects file:// URLs", () => {
    expect(isUnhostedPdfReference("file:///Users/me/report.pdf")).toBe(true);
  });

  it("detects bare PDF filenames", () => {
    expect(isUnhostedPdfReference("report.pdf")).toBe(true);
  });

  it("detects partial encoded PDF filenames", () => {
    expect(isUnhostedPdfReference("026-03%20Report.pdf")).toBe(true);
  });

  it("detects Windows paths", () => {
    expect(isUnhostedPdfReference("C:\\Users\\me\\report.pdf")).toBe(true);
  });

  it("allows site paths ending in .pdf", () => {
    expect(isUnhostedPdfReference("/newsletters/annual-report.pdf")).toBe(false);
  });

  it("allows hosted Supabase PDF URLs", () => {
    expect(
      isUnhostedPdfReference(
        "https://testref.supabase.co/storage/v1/object/public/newsletter-assets/temp/documents/abc.pdf",
      ),
    ).toBe(false);
  });
});

describe("validateNewsletterPdfLinkUrl", () => {
  it("returns upload-required for bare PDF filename", () => {
    expect(validateNewsletterPdfLinkUrl("report.pdf")).toBe(PDF_UPLOAD_REQUIRED_MESSAGE);
  });

  it("returns upload-required for file://", () => {
    expect(validateNewsletterPdfLinkUrl("file:///tmp/x.pdf")).toContain("uploaded");
  });

  it("accepts hosted PDF URL", () => {
    expect(
      validateNewsletterPdfLinkUrl(
        "https://testref.supabase.co/storage/v1/object/public/newsletter-assets/temp/documents/a.pdf",
      ),
    ).toBeNull();
  });
});

describe("Button block PDF upload", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            url: "https://testref.supabase.co/storage/v1/object/public/newsletter-assets/temp/documents/btn.pdf",
            storage: "supabase",
          }),
          { status: 200 },
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stores hosted URL suitable for button validation", async () => {
    const file = new File(["%PDF"], "026-03 Report.pdf", { type: "application/pdf" });
    const { url } = await uploadNewsletterDocumentFile(file);
    expect(url).toMatch(/^https:\/\//);
    expect(needsPdfUploadBeforeUse(url)).toBe(false);
    expect(isValidNewsletterPdfLinkUrl(url)).toBe(true);
    expect(validateNewsletterPdfLinkUrl(url)).toBeNull();
  });
});

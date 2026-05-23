import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { uploadNewsletterDocumentFile } from "./document-upload";

describe("uploadNewsletterDocumentFile", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            url: "https://testref.supabase.co/storage/v1/object/public/newsletter-assets/temp/documents/abc.pdf",
            path: "temp/documents/abc.pdf",
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

  it("returns a hosted URL after upload (never file://)", async () => {
    const file = new File(["%PDF-1.4"], "guide.pdf", { type: "application/pdf" });
    const result = await uploadNewsletterDocumentFile(file);
    expect(result.url).toMatch(/^https:\/\//);
    expect(result.url).not.toMatch(/^file:/);
    expect(fetch).toHaveBeenCalledWith(
      "/api/admin/upload-newsletter-document",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("surfaces server error message from API body", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "Upload failed: Storage bucket not configured.",
        }),
        { status: 500 },
      ),
    );
    const file = new File(["%PDF"], "x.pdf", { type: "application/pdf" });
    await expect(uploadNewsletterDocumentFile(file)).rejects.toThrow(
      "Storage bucket not configured",
    );
  });
});

import { describe, expect, it, vi, afterEach } from "vitest";

vi.mock("server-only", () => ({}));
import {
  mapSupabaseStorageErrorMessage,
  parseNewsletterUploadApiError,
  UNAUTHORIZED_UPLOAD_MESSAGE,
} from "./newsletter-upload-errors-client";

describe("mapSupabaseStorageErrorMessage", () => {
  it("maps missing bucket", () => {
    expect(mapSupabaseStorageErrorMessage("Bucket not found", "404", "pdf")).toContain(
      "Storage bucket not configured",
    );
  });

  it("maps mime rejection for PDF", () => {
    expect(mapSupabaseStorageErrorMessage("mime type application/pdf is not allowed", "400", "pdf")).toContain(
      "application/pdf",
    );
    expect(
      mapSupabaseStorageErrorMessage("mime type application/pdf is not supported", "415", "pdf"),
    ).toContain("application/pdf");
  });
});

describe("parseNewsletterUploadApiError", () => {
  it("returns unauthorized message", () => {
    expect(parseNewsletterUploadApiError(401, null)).toBe(UNAUTHORIZED_UPLOAD_MESSAGE);
  });
});

describe("formatNewsletterUploadErrorBody (server)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefixes with Upload failed in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { formatNewsletterUploadErrorBody } = await import("./newsletter-upload-errors-server");
    const body = formatNewsletterUploadErrorBody("Bucket not found", "pdf");
    expect(body.error).toMatch(/^Upload failed:/);
    expect(body.error).toContain("Storage bucket not configured");
  });

  it("returns friendly message in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { formatNewsletterUploadErrorBody } = await import("./newsletter-upload-errors-server");
    const body = formatNewsletterUploadErrorBody("Bucket not found", "pdf");
    expect(body.error).toContain("Storage bucket not configured");
    expect(body.error).not.toBe("Upload failed.");
  });
});

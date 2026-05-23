import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Session } from "next-auth";
import { POST } from "./route";

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn<() => Promise<Session | null>>(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/supabase/config-env", () => ({
  getSupabaseStorageConfigProblems: vi.fn(() => []),
  supabaseStorageNotConfiguredMessage: vi.fn(() => "Storage not configured."),
}));

vi.mock("@/lib/supabase/config-server", () => ({
  logSupabaseServiceRoleKeyDebug: vi.fn(),
}));

vi.mock("@/lib/supabase/newsletter-media", () => ({
  uploadNewsletterDocument: vi.fn(),
}));

import { getSupabaseStorageConfigProblems } from "@/lib/supabase/config-env";
import { uploadNewsletterDocument } from "@/lib/supabase/newsletter-media";

function pdfRequest(): Request {
  const fd = new FormData();
  fd.append("file", new File(["%PDF-1.4"], "test.pdf", { type: "application/pdf" }));
  return new Request("http://localhost/api/admin/upload-newsletter-document", {
    method: "POST",
    body: fd,
  });
}

describe("POST /api/admin/upload-newsletter-document", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseStorageConfigProblems).mockReturnValue([]);
    mockAuth.mockResolvedValue({
      user: { id: "u1", email: "admin@test.com", role: "ADMIN" },
      expires: new Date(Date.now() + 3600_000).toISOString(),
    } as Session);
  });

  it("returns 401 when not authenticated as admin", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await POST(pdfRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/not authorized/i);
  });

  it("returns hosted URL on successful upload", async () => {
    const url =
      "https://testref.supabase.co/storage/v1/object/public/newsletter-assets/temp/documents/x.pdf";
    vi.mocked(uploadNewsletterDocument).mockResolvedValue({
      url,
      path: "temp/documents/x.pdf",
    });
    const res = await POST(pdfRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe(url);
  });

  it("returns 503 when Supabase env is missing", async () => {
    vi.mocked(getSupabaseStorageConfigProblems).mockReturnValue([
      { variable: "SUPABASE_SERVICE_ROLE_KEY", kind: "missing" },
    ]);
    const res = await POST(pdfRequest());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toMatch(/not configured|Storage/i);
  });

  it("returns specific error when bucket is missing", async () => {
    vi.mocked(uploadNewsletterDocument).mockRejectedValue(
      new Error("Storage bucket not configured. Create the newsletter-assets bucket in Supabase."),
    );
    const res = await POST(pdfRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Storage bucket not configured");
    expect(body.error).not.toBe("Upload failed.");
  });
});

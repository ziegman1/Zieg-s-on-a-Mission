import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/config-env", () => ({
  getSupabaseProjectUrl: vi.fn(() => "https://testref.supabase.co"),
  NEWSLETTER_ASSETS_BUCKET: "newsletter-assets",
}));

vi.mock("@/lib/supabase/storage-admin", () => ({
  getSupabaseStorageAdmin: vi.fn(),
}));

import { getNewsletterAssetPublicUrl, uploadNewsletterDocument } from "./newsletter-media";
import { getSupabaseStorageAdmin } from "@/lib/supabase/storage-admin";

describe("getNewsletterAssetPublicUrl", () => {
  it("builds encoded public object URL", () => {
    const url = getNewsletterAssetPublicUrl("temp/documents/my file.pdf");
    expect(url).toBe(
      "https://testref.supabase.co/storage/v1/object/public/newsletter-assets/temp/documents/my%20file.pdf",
    );
  });
});

describe("uploadNewsletterDocument", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns url and path on success", async () => {
    vi.mocked(getSupabaseStorageAdmin).mockReturnValue({
      storage: {
        from: () => ({
          upload: vi.fn().mockResolvedValue({ data: { path: "temp/documents/x.pdf" }, error: null }),
        }),
      },
    } as unknown as ReturnType<typeof getSupabaseStorageAdmin>);

    const result = await uploadNewsletterDocument(Buffer.from("%PDF"), {});
    expect(result.url).toContain("/storage/v1/object/public/newsletter-assets/");
    expect(result.path).toMatch(/documents\/.+\.pdf$/);
  });

  it("throws mapped error when PDF mime is rejected", async () => {
    vi.mocked(getSupabaseStorageAdmin).mockReturnValue({
      storage: {
        from: () => ({
          upload: vi.fn().mockResolvedValue({
            data: null,
            error: {
              message: "mime type application/pdf is not supported",
              statusCode: "415",
            },
          }),
        }),
      },
    } as unknown as ReturnType<typeof getSupabaseStorageAdmin>);

    await expect(uploadNewsletterDocument(Buffer.from("%PDF"), {})).rejects.toThrow(
      /application\/pdf/,
    );
  });
});

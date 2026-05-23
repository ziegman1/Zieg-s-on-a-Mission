import { describe, expect, it, vi } from "vitest";
import { getNewsletterAssetPublicUrl } from "./newsletter-media";

vi.mock("@/lib/supabase/config", () => ({
  assertSupabaseStorageReady: vi.fn(),
  getSupabaseProjectUrl: vi.fn(() => "https://testref.supabase.co"),
  getSupabaseServiceRoleKey: vi.fn(() => "eyJ.test"),
  NEWSLETTER_ASSETS_BUCKET: "newsletter-assets",
  supabaseServiceRoleKeyErrorMessage: vi.fn(),
}));

describe("getNewsletterAssetPublicUrl", () => {
  it("builds public object URL for newsletter-assets bucket", () => {
    expect(getNewsletterAssetPublicUrl("branding/header/abc.jpg")).toBe(
      "https://testref.supabase.co/storage/v1/object/public/newsletter-assets/branding/header/abc.jpg",
    );
  });

  it("encodes path segments", () => {
    expect(getNewsletterAssetPublicUrl("temp/block/a b.jpg")).toBe(
      "https://testref.supabase.co/storage/v1/object/public/newsletter-assets/temp/block/a%20b.jpg",
    );
  });
});

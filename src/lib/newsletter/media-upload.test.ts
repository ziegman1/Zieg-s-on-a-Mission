import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  isLikelyImageUrl,
  uploadNewsletterImageFile,
  validateNewsletterImageFile,
} from "./media-upload";

describe("validateNewsletterImageFile", () => {
  it("rejects oversized files", () => {
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.jpg", {
      type: "image/jpeg",
    });
    expect(validateNewsletterImageFile(big)).toBe("Image exceeds size limit.");
  });

  it("rejects unsupported types", () => {
    const gif = new File([new Uint8Array(100)], "x.gif", { type: "image/gif" });
    expect(validateNewsletterImageFile(gif)).toBe("Unsupported file type.");
  });

  it("accepts valid jpeg", () => {
    const ok = new File([new Uint8Array(100)], "ok.jpg", { type: "image/jpeg" });
    expect(validateNewsletterImageFile(ok)).toBeNull();
  });
});

describe("isLikelyImageUrl", () => {
  it("accepts https supabase public urls", () => {
    expect(
      isLikelyImageUrl(
        "https://example.supabase.co/storage/v1/object/public/newsletter-assets/branding/header/x.jpg",
      ),
    ).toBe(true);
  });

  it("rejects garbage", () => {
    expect(isLikelyImageUrl("not-a-url")).toBe(false);
  });
});

describe("uploadNewsletterImageFile", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns public url on success", async () => {
    const url =
      "https://ref.supabase.co/storage/v1/object/public/newsletter-assets/branding/header/a.jpg";
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ url, storage: "supabase" }), { status: 200 }),
    );

    const file = new File([new Uint8Array(10)], "h.jpg", { type: "image/jpeg" });
    const result = await uploadNewsletterImageFile(file, "header");
    expect(result.url).toBe(url);
    expect(fetch).toHaveBeenCalledWith("/api/admin/upload-newsletter-image", {
      method: "POST",
      body: expect.any(FormData),
    });
  });

  it("sends newsletterId when provided", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ url: "https://x/y.jpg" }), { status: 200 }),
    );
    const file = new File([new Uint8Array(10)], "b.jpg", { type: "image/jpeg" });
    await uploadNewsletterImageFile(file, "block", { newsletterId: "nl_1" });

    const fd = vi.mocked(fetch).mock.calls[0]?.[1]?.body as FormData;
    expect(fd.get("newsletterId")).toBe("nl_1");
    expect(fd.get("purpose")).toBe("block");
  });

  it("throws clean message on failed upload", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Upload failed." }), { status: 500 }),
    );
    const file = new File([new Uint8Array(10)], "h.jpg", { type: "image/jpeg" });
    await expect(uploadNewsletterImageFile(file, "header")).rejects.toThrow("Upload failed.");
  });

  it("throws on 401", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    );
    const file = new File([new Uint8Array(10)], "h.jpg", { type: "image/jpeg" });
    await expect(uploadNewsletterImageFile(file, "header")).rejects.toThrow(
      "Upload failed. Sign in as an admin.",
    );
  });
});

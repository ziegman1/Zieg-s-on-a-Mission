import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_NEWSLETTER_BRAND_SETTINGS } from "@/lib/newsletter/brand-defaults";

vi.mock("@/lib/admin-auth", () => ({
  requireAdminSession: vi.fn(),
}));

vi.mock("@/lib/newsletter/brand-settings", () => ({
  upsertNewsletterBrandSettings: vi.fn(),
  parseNewsletterBrandSettingsInput: vi.fn((input: unknown) => input),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { requireAdminSession } from "@/lib/admin-auth";
import { upsertNewsletterBrandSettings } from "@/lib/newsletter/brand-settings";
import { saveNewsletterBrandSettingsAction } from "./newsletter-brand-actions";

describe("saveNewsletterBrandSettingsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminSession).mockResolvedValue({ id: "admin", role: "ADMIN" });
  });

  it("returns friendly error when persistence fails", async () => {
    vi.mocked(upsertNewsletterBrandSettings).mockRejectedValue(
      new TypeError("Cannot read properties of undefined (reading 'upsert')"),
    );

    const res = await saveNewsletterBrandSettingsAction(DEFAULT_NEWSLETTER_BRAND_SETTINGS);

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toBe("Unable to save branding settings.");
      expect(res.error).not.toContain("upsert");
    }
  });

  it("saves branding when persistence succeeds", async () => {
    vi.mocked(upsertNewsletterBrandSettings).mockResolvedValue({
      ...DEFAULT_NEWSLETTER_BRAND_SETTINGS,
      defaultHeaderImageUrl: "https://cdn.example.com/header.png",
    });

    const res = await saveNewsletterBrandSettingsAction({
      ...DEFAULT_NEWSLETTER_BRAND_SETTINGS,
      defaultHeaderImageUrl: "https://cdn.example.com/header.png",
      headerAltText: "Header alt",
    });

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.settings.defaultHeaderImageUrl).toBe("https://cdn.example.com/header.png");
    }
  });
});

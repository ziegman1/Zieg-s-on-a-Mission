import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_NEWSLETTER_BRAND_SETTINGS } from "./brand-defaults";
import {
  normalizeHexColor,
  parseNewsletterBrandSettingsInput,
} from "./brand-settings";
import {
  isBrandedNewsletterLayout,
  resolveNewsletterHeader,
} from "./resolve-header";
import { resolveNewsletterFooter } from "./resolve-footer";

vi.mock("@/lib/newsletter/prisma-brand-settings", () => ({
  runNewsletterBrandSettingsQuery: vi.fn(),
}));

import { runNewsletterBrandSettingsQuery } from "./prisma-brand-settings";
import {
  getNewsletterBrandSettings,
  upsertNewsletterBrandSettings,
} from "./brand-settings";
import { formatNewsletterBrandSettingsError } from "./errors";

const dbRow = {
  id: "default",
  defaultHeaderImageUrl: "https://cdn.example.com/h.png",
  headerAltText: "Alt",
  defaultFooterImageUrl: "https://cdn.example.com/footer.png",
  footerAltText: "Footer alt",
  brandBackgroundColor: "#F7F3EB",
  accentColor: "#D4E8F5",
  lineAccentColor: "#B8D4E8",
  defaultFooterText: "Thank you",
  defaultCtaLabel: "Give",
  defaultCtaUrl: "/give",
  useDefaultHeaderForNew: true,
  useDefaultFooterImageOnNewNewsletters: true,
  updatedAt: new Date(),
};

describe("normalizeHexColor", () => {
  it("normalizes short hex", () => {
    expect(normalizeHexColor("#abc", "#000")).toBe("#aabbcc");
  });

  it("falls back on invalid color", () => {
    expect(normalizeHexColor("not-a-color", "#F7F3EB")).toBe("#F7F3EB");
  });
});

describe("parseNewsletterBrandSettingsInput", () => {
  it("parses header URL for save", () => {
    const parsed = parseNewsletterBrandSettingsInput({
      ...DEFAULT_NEWSLETTER_BRAND_SETTINGS,
      defaultHeaderImageUrl: "https://cdn.example.com/header.png",
      headerAltText: "Ministry newsletter header",
    });
    expect(parsed.defaultHeaderImageUrl).toBe("https://cdn.example.com/header.png");
  });
});

describe("resolveNewsletterHeader", () => {
  const brand = {
    ...DEFAULT_NEWSLETTER_BRAND_SETTINGS,
    defaultHeaderImageUrl: "https://cdn.example.com/default-header.png",
    headerAltText: "Ziegs header",
  };

  it("uses default header when newsletter has no override", () => {
    const header = resolveNewsletterHeader(
      { headerImageUrl: null, useDefaultBrandedHeader: true },
      brand,
    );
    expect(header.imageUrl).toBe("https://cdn.example.com/default-header.png");
    expect(isBrandedNewsletterLayout(header)).toBe(true);
  });

  it("uses newsletter-specific override", () => {
    const header = resolveNewsletterHeader(
      {
        headerImageUrl: "https://cdn.example.com/custom.png",
        useDefaultBrandedHeader: false,
      },
      brand,
    );
    expect(header.imageUrl).toBe("https://cdn.example.com/custom.png");
  });

  it("opts out of default header when useDefaultBrandedHeader is false", () => {
    const header = resolveNewsletterHeader(
      { headerImageUrl: null, useDefaultBrandedHeader: false },
      brand,
    );
    expect(header.imageUrl).toBeNull();
    expect(isBrandedNewsletterLayout(header)).toBe(false);
  });

  it("falls back to legacy layout when no brand header configured", () => {
    const header = resolveNewsletterHeader(
      { headerImageUrl: null, useDefaultBrandedHeader: true },
      { ...brand, defaultHeaderImageUrl: null },
    );
    expect(header.imageUrl).toBeNull();
    expect(isBrandedNewsletterLayout(header)).toBe(false);
  });
});

describe("resolveNewsletterFooter", () => {
  const brand = {
    ...DEFAULT_NEWSLETTER_BRAND_SETTINGS,
    defaultFooterImageUrl: "https://cdn.example.com/default-footer.png",
    footerAltText: "Ministry footer",
    defaultFooterText: "Thank you for reading.",
  };

  it("uses default footer image for new newsletters", () => {
    const footer = resolveNewsletterFooter(
      { footerImageUrl: null, footerAltText: "", useDefaultFooterImage: true },
      brand,
    );
    expect(footer.imageUrl).toBe("https://cdn.example.com/default-footer.png");
    expect(footer.alt).toBe("Ministry footer");
  });

  it("uses issue override over brand default", () => {
    const footer = resolveNewsletterFooter(
      {
        footerImageUrl: "https://cdn.example.com/issue-footer.png",
        footerAltText: "Issue alt",
        useDefaultFooterImage: false,
      },
      brand,
    );
    expect(footer.imageUrl).toBe("https://cdn.example.com/issue-footer.png");
    expect(footer.alt).toBe("Issue alt");
  });

  it("falls back to footer text when no image", () => {
    const footer = resolveNewsletterFooter(
      { footerImageUrl: null, footerAltText: "", useDefaultFooterImage: false },
      { ...brand, defaultFooterImageUrl: null },
    );
    expect(footer.imageUrl).toBeNull();
    expect(footer.text).toBe("Thank you for reading.");
  });
});

describe("brand settings persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns defaults when singleton row is missing", async () => {
    vi.mocked(runNewsletterBrandSettingsQuery).mockImplementation(async (run) =>
      run({
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn(),
      } as never),
    );

    const settings = await getNewsletterBrandSettings();
    expect(settings.brandBackgroundColor).toBe(
      DEFAULT_NEWSLETTER_BRAND_SETTINGS.brandBackgroundColor,
    );
  });

  it("updates singleton row when default exists", async () => {
    const update = vi.fn().mockResolvedValue(dbRow);
    const findUnique = vi.fn().mockResolvedValue(dbRow);
    vi.mocked(runNewsletterBrandSettingsQuery).mockImplementation(async (run) =>
      run({ findUnique, update, create: vi.fn() } as never),
    );

    const saved = await upsertNewsletterBrandSettings({
      ...DEFAULT_NEWSLETTER_BRAND_SETTINGS,
      defaultHeaderImageUrl: "https://cdn.example.com/h.png",
      headerAltText: "Alt",
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "default" } }),
    );
    expect(saved.defaultHeaderImageUrl).toBe("https://cdn.example.com/h.png");
  });

  it("creates singleton row on first save", async () => {
    const create = vi.fn().mockResolvedValue(dbRow);
    vi.mocked(runNewsletterBrandSettingsQuery).mockImplementation(async (run) =>
      run({
        findUnique: vi.fn().mockResolvedValue(null),
        create,
        update: vi.fn(),
      } as never),
    );

    await upsertNewsletterBrandSettings(DEFAULT_NEWSLETTER_BRAND_SETTINGS);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ id: "default" }),
      }),
    );
  });

  it("surfaces friendly admin error when delegate is unavailable", () => {
    const err = new Error(
      "Newsletter branding Prisma client is not ready. Run npx prisma generate",
    );
    expect(formatNewsletterBrandSettingsError(err)).toBe("Unable to save branding settings.");
  });
});

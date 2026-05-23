import { DEFAULT_NEWSLETTER_BRAND_SETTINGS } from "./brand-defaults";
import type { NewsletterBrandSettings, NewsletterBrandSettingsInput } from "./brand-types";
import { runNewsletterBrandSettingsQuery } from "./prisma-brand-settings";

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

export function normalizeHexColor(value: string, fallback: string): string {
  const t = value.trim();
  if (!t) return fallback;
  if (HEX_COLOR.test(t)) return t.length === 4 ? expandShortHex(t) : t;
  return fallback;
}

function expandShortHex(hex: string): string {
  const r = hex[1]!;
  const g = hex[2]!;
  const b = hex[3]!;
  return `#${r}${r}${g}${g}${b}${b}`;
}

function rowToSettings(row: {
  defaultHeaderImageUrl: string | null;
  headerAltText: string;
  defaultFooterImageUrl: string | null;
  footerAltText: string;
  brandBackgroundColor: string;
  accentColor: string;
  lineAccentColor: string;
  defaultFooterText: string;
  defaultCtaLabel: string;
  defaultCtaUrl: string;
  useDefaultHeaderForNew: boolean;
  useDefaultFooterImageOnNewNewsletters: boolean;
}): NewsletterBrandSettings {
  const d = DEFAULT_NEWSLETTER_BRAND_SETTINGS;
  return {
    defaultHeaderImageUrl: row.defaultHeaderImageUrl?.trim() || null,
    headerAltText: row.headerAltText.trim() || d.headerAltText,
    defaultFooterImageUrl: row.defaultFooterImageUrl?.trim() || null,
    footerAltText: row.footerAltText.trim() || d.footerAltText,
    brandBackgroundColor: normalizeHexColor(row.brandBackgroundColor, d.brandBackgroundColor),
    accentColor: normalizeHexColor(row.accentColor, d.accentColor),
    lineAccentColor: normalizeHexColor(row.lineAccentColor, d.lineAccentColor),
    defaultFooterText: row.defaultFooterText.trim(),
    defaultCtaLabel: row.defaultCtaLabel.trim(),
    defaultCtaUrl: row.defaultCtaUrl.trim(),
    useDefaultHeaderForNew: row.useDefaultHeaderForNew,
    useDefaultFooterImageOnNewNewsletters: row.useDefaultFooterImageOnNewNewsletters,
  };
}

const singletonWhere = { id: "default" as const };

const singletonPayload = (parsed: NewsletterBrandSettings) => ({
  defaultHeaderImageUrl: parsed.defaultHeaderImageUrl,
  headerAltText: parsed.headerAltText,
  defaultFooterImageUrl: parsed.defaultFooterImageUrl,
  footerAltText: parsed.footerAltText,
  brandBackgroundColor: parsed.brandBackgroundColor,
  accentColor: parsed.accentColor,
  lineAccentColor: parsed.lineAccentColor,
  defaultFooterText: parsed.defaultFooterText,
  defaultCtaLabel: parsed.defaultCtaLabel,
  defaultCtaUrl: parsed.defaultCtaUrl,
  useDefaultHeaderForNew: parsed.useDefaultHeaderForNew,
  useDefaultFooterImageOnNewNewsletters: parsed.useDefaultFooterImageOnNewNewsletters,
});

export async function getNewsletterBrandSettings(): Promise<NewsletterBrandSettings> {
  try {
    const row = await runNewsletterBrandSettingsQuery(
      (delegate) => delegate.findUnique({ where: singletonWhere }),
      { quiet: true },
    );
    if (!row) return { ...DEFAULT_NEWSLETTER_BRAND_SETTINGS };
    return rowToSettings(row);
  } catch {
    return { ...DEFAULT_NEWSLETTER_BRAND_SETTINGS };
  }
}

export function parseNewsletterBrandSettingsInput(
  input: NewsletterBrandSettingsInput,
): NewsletterBrandSettings {
  const d = DEFAULT_NEWSLETTER_BRAND_SETTINGS;
  return {
    defaultHeaderImageUrl: input.defaultHeaderImageUrl?.trim() || null,
    headerAltText: input.headerAltText.trim() || d.headerAltText,
    defaultFooterImageUrl: input.defaultFooterImageUrl?.trim() || null,
    footerAltText: input.footerAltText.trim() || d.footerAltText,
    brandBackgroundColor: normalizeHexColor(input.brandBackgroundColor, d.brandBackgroundColor),
    accentColor: normalizeHexColor(input.accentColor, d.accentColor),
    lineAccentColor: normalizeHexColor(input.lineAccentColor, d.lineAccentColor),
    defaultFooterText: input.defaultFooterText.trim(),
    defaultCtaLabel: input.defaultCtaLabel.trim(),
    defaultCtaUrl: input.defaultCtaUrl.trim(),
    useDefaultHeaderForNew: Boolean(input.useDefaultHeaderForNew),
    useDefaultFooterImageOnNewNewsletters: Boolean(input.useDefaultFooterImageOnNewNewsletters),
  };
}

/** Persist singleton branding row (`id: default`). Uses update/create (pooler-safe). */
export async function upsertNewsletterBrandSettings(
  input: NewsletterBrandSettingsInput,
): Promise<NewsletterBrandSettings> {
  const parsed = parseNewsletterBrandSettingsInput(input);
  const payload = singletonPayload(parsed);

  const row = await runNewsletterBrandSettingsQuery(async (delegate) => {
    const existing = await delegate.findUnique({ where: singletonWhere });
    if (existing) {
      return delegate.update({
        where: singletonWhere,
        data: payload,
      });
    }
    return delegate.create({
      data: {
        id: "default",
        ...payload,
      },
    });
  });

  return rowToSettings(row);
}

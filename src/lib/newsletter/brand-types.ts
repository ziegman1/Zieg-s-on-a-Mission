export type NewsletterBrandSettings = {
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
};

export type NewsletterBrandSettingsInput = NewsletterBrandSettings;

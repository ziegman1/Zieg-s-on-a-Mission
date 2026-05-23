import type { NewsletterBrandSettings } from "./brand-types";

export const DEFAULT_NEWSLETTER_BRAND_SETTINGS: NewsletterBrandSettings = {
  defaultHeaderImageUrl: null,
  headerAltText: "Ziegs on a Mission newsletter header",
  defaultFooterImageUrl: null,
  footerAltText: "Ziegs on a Mission newsletter footer",
  brandBackgroundColor: "#F7F3EB",
  accentColor: "#D4E8F5",
  lineAccentColor: "#B8D4E8",
  defaultFooterText: "",
  defaultCtaLabel: "",
  defaultCtaUrl: "",
  useDefaultHeaderForNew: true,
  useDefaultFooterImageOnNewNewsletters: true,
};

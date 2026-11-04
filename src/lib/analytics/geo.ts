/**
 * Server-derived analytics geography.
 * Country must come from the platform (Vercel) or an explicit server-only override —
 * never from client body/query/custom headers the browser can set freely.
 */

/** EU/EEA members + UK (GB) and Switzerland often grouped with EU privacy expectations. */
export const ANALYTICS_CONSENT_COUNTRY_CODES = new Set([
  // EU
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  // EEA (non-EU)
  "IS",
  "LI",
  "NO",
  // UK
  "GB",
]);

export type AnalyticsRegionMode = "open" | "consent_required";

export function normalizeCountryCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  return code;
}

/**
 * Classify whether first-party analytics may run under disclosure-only rules
 * or require affirmative opt-in first.
 * - EEA/UK → consent_required
 * - Unknown / untrusted geo → consent_required (privacy-protective default)
 * - Other known countries (e.g. US) → open (disclosed first-party)
 */
export function classifyAnalyticsRegionMode(
  countryCode: string | null | undefined,
): AnalyticsRegionMode {
  const code = normalizeCountryCode(countryCode ?? null);
  if (!code) return "consent_required";
  if (ANALYTICS_CONSENT_COUNTRY_CODES.has(code)) return "consent_required";
  return "open";
}

export type ResolveCountryOptions = {
  /** process.env.VERCEL — only trust x-vercel-ip-country when "1". */
  vercelEnv?: string | null;
  /** Server-only test/dev override (ANALYTICS_GEO_COUNTRY_OVERRIDE). */
  override?: string | null;
};

/**
 * Resolve visitor country for analytics gating.
 * Ignores client-supplied country fields; callers must not pass body.country here.
 */
export function resolveRequestCountryCode(
  headers: Headers,
  options: ResolveCountryOptions = {},
): string | null {
  const override = normalizeCountryCode(
    options.override ?? process.env.ANALYTICS_GEO_COUNTRY_OVERRIDE,
  );
  if (override) return override;

  const onVercel = (options.vercelEnv ?? process.env.VERCEL) === "1";
  if (!onVercel) {
    // Local / non-Vercel: do not trust spoofable inbound geo headers.
    return null;
  }

  return normalizeCountryCode(headers.get("x-vercel-ip-country"));
}

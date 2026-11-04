import {
  classifyAnalyticsRegionMode,
  resolveRequestCountryCode,
  type AnalyticsRegionMode,
  type ResolveCountryOptions,
} from "./geo";

export const ANALYTICS_CONSENT_COOKIE = "zoam_analytics_consent";

export type AnalyticsConsentValue = "granted" | "denied";
export type AnalyticsConsentStatus = AnalyticsConsentValue | "unset";

export const analyticsConsentCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export function parseAnalyticsConsentCookie(
  raw: string | null | undefined,
): AnalyticsConsentStatus {
  if (raw === "granted" || raw === "denied") return raw;
  return "unset";
}

export function isAnalyticsConsentChoice(
  value: unknown,
): value is AnalyticsConsentValue {
  return value === "granted" || value === "denied";
}

export type AnalyticsPrivacyDecision = {
  regionMode: AnalyticsRegionMode;
  consent: AnalyticsConsentStatus;
  /** True when page views, engagement, sessionStorage session IDs, and visitorId ingest may proceed. */
  collectionAllowed: boolean;
  /** Country used for gating when known; omitted from public API responses. */
  countryCode: string | null;
};

export function decideAnalyticsPrivacy(input: {
  headers: Headers;
  consentCookie: string | null | undefined;
  geoOptions?: ResolveCountryOptions;
}): AnalyticsPrivacyDecision {
  const countryCode = resolveRequestCountryCode(input.headers, input.geoOptions);
  const regionMode = classifyAnalyticsRegionMode(countryCode);
  const consent = parseAnalyticsConsentCookie(input.consentCookie);

  if (regionMode === "open") {
    return { regionMode, consent, collectionAllowed: true, countryCode };
  }

  return {
    regionMode,
    consent,
    collectionAllowed: consent === "granted",
    countryCode,
  };
}

/** Read consent cookie from a Fetch Request. */
export function consentCookieFromRequest(req: Request): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  const parts = header.split(";");
  for (const part of parts) {
    const [name, ...rest] = part.trim().split("=");
    if (name === ANALYTICS_CONSENT_COOKIE) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return null;
}

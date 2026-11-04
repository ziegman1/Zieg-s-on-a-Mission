"use client";

import { AnalyticsPreferencesButton } from "./analytics-consent-banner";
import { useAnalyticsPrivacyOptional } from "./analytics-privacy-provider";

/** Privacy-page control to change EEA/UK analytics consent later. */
export function PrivacyAnalyticsPreferences() {
  const privacy = useAnalyticsPrivacyOptional();
  if (!privacy || privacy.regionMode !== "consent_required") return null;

  return (
    <p className="mt-4">
      <AnalyticsPreferencesButton className="text-brand-primary underline underline-offset-2 hover:text-brand-primary/80" />
    </p>
  );
}

"use client";

import Link from "next/link";
import { useAnalyticsPrivacyOptional } from "./analytics-privacy-provider";

/**
 * Affirmative opt-in/out for EEA/UK (and unknown geo) first-party analytics.
 * Not shown for open (e.g. US) disclosure-only regions.
 */
export function AnalyticsConsentBanner() {
  const privacy = useAnalyticsPrivacyOptional();
  if (!privacy?.showBanner) return null;

  const { consent, preferencesOpen, setConsentChoice, closePreferences } = privacy;
  const isUpdate = preferencesOpen && consent !== "unset";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="analytics-consent-title"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-brand-primary/30 bg-[#1a1814] px-4 py-4 text-cream shadow-[0_-8px_32px_rgba(0,0,0,0.35)] sm:px-6"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2 text-sm leading-relaxed text-cream/85">
          <p id="analytics-consent-title" className="font-serif text-base text-cream tracking-wide">
            {isUpdate ? "Analytics preferences" : "Analytics choice"}
          </p>
          <p>
            We use first-party analytics (page paths, a short-lived tab session id, and optional
            coarse engagement signals) to improve this ministry site. No third-party ad pixels.
            You can{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-cream">
              read the Privacy Policy
            </Link>
            . Decline keeps analytics off for this browser until you change your choice.
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          {isUpdate ? (
            <button
              type="button"
              onClick={() => closePreferences()}
              className="rounded-md border border-cream/30 px-3 py-2 text-sm text-cream/80 hover:border-cream/60"
            >
              Close
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void setConsentChoice("denied")}
            className="rounded-md border border-cream/40 px-3 py-2 text-sm text-cream hover:bg-cream/10"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => void setConsentChoice("granted")}
            className="rounded-md bg-brand-primary px-3 py-2 text-sm font-medium text-cream hover:bg-brand-primary/90"
          >
            Accept analytics
          </button>
        </div>
      </div>
    </div>
  );
}

/** Footer / privacy control to reopen the choice later. */
export function AnalyticsPreferencesButton({ className }: { className?: string }) {
  const privacy = useAnalyticsPrivacyOptional();
  if (!privacy || privacy.regionMode !== "consent_required") return null;

  return (
    <button
      type="button"
      onClick={() => privacy.openPreferences()}
      className={className}
    >
      Analytics preferences
    </button>
  );
}

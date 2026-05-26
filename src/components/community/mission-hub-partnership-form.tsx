"use client";

import { useState } from "react";
import {
  DEFAULT_PARTNERSHIP_ONBOARDING_SELECTION,
  PARTNERSHIP_PREF_KEYS,
  PARTNERSHIP_PREF_LABELS,
  type PartnershipPrefKey,
  type PartnershipPreferences,
} from "@/lib/community/partnership-preferences";
import { cn } from "@/lib/utils";

function selectionFromPrefs(
  prefs: PartnershipPreferences | null,
): Record<PartnershipPrefKey, boolean> {
  if (!prefs) return { ...DEFAULT_PARTNERSHIP_ONBOARDING_SELECTION };
  return {
    ministryUpdates: prefs.ministryUpdates,
    newsletters: prefs.newsletters,
    prayerTeam: prefs.prayerTeam,
    urgentPrayerRequests: prefs.urgentPrayerRequests,
    advocacyInterest: prefs.advocacyInterest,
    financialPartnership: prefs.financialPartnership,
  };
}

export function MissionHubPartnershipForm({
  initialPrefs = null,
  onSubmit,
  submitLabel = "Continue",
  pending = false,
  error = null,
  idPrefix = "partnership",
}: {
  initialPrefs?: PartnershipPreferences | null;
  onSubmit: (selection: Record<PartnershipPrefKey, boolean>) => void | Promise<void>;
  submitLabel?: string;
  pending?: boolean;
  error?: string | null;
  idPrefix?: string;
}) {
  const [selection, setSelection] = useState(() => selectionFromPrefs(initialPrefs));

  function toggle(key: PartnershipPrefKey) {
    setSelection((s) => ({ ...s, [key]: !s[key] }));
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(selection);
      }}
    >
      <ul className="space-y-2.5">
        {PARTNERSHIP_PREF_KEYS.map((key) => {
          const meta = PARTNERSHIP_PREF_LABELS[key];
          const inputId = `${idPrefix}-${key}`;
          const checked = selection[key];
          return (
            <li key={key}>
              <label
                htmlFor={inputId}
                className={cn(
                  "flex gap-3 rounded-xl border px-3.5 py-3 cursor-pointer touch-manipulation",
                  "transition-colors duration-150",
                  checked
                    ? "border-brand-primary/35 bg-brand-primary/[0.06]"
                    : "border-black/[0.06] bg-white/90 hover:border-brand-primary/20",
                )}
              >
                <input
                  id={inputId}
                  name={key}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(key)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-black/20 text-brand-primary focus-visible:ring-brand-primary/40"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-brand-ink leading-snug">
                    {meta.label}
                  </span>
                  <span className="block mt-0.5 text-xs text-brand-ink/55 leading-relaxed">
                    {meta.description}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "w-full rounded-full min-h-[2.875rem] px-5 text-sm font-semibold",
          "bg-brand-primary text-white shadow-[0_4px_16px_rgba(131,176,218,0.35)]",
          "hover:bg-brand-primary/93 active:scale-[0.99] transition-transform touch-manipulation",
          "disabled:opacity-60",
        )}
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

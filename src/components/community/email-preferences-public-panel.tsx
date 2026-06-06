"use client";

import { useEffect, useState, useTransition } from "react";
import {
  loadEmailPreferencesByToken,
  saveEmailPreferencesByTokenAction,
} from "@/app/(storefront)/community/email-preference-actions";
import {
  EmailCategoryFrequencyFields,
  EmailChannelToggle,
} from "@/components/community/email-preferences-form";
import type { NotificationPreferences } from "@/lib/community/settings-types";
import { Button } from "@/components/ui/button";

export function EmailPreferencesPublicPanel({ token }: { token: string }) {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await loadEmailPreferencesByToken(token);
      if (cancelled) return;
      if (!res.ok) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setPrefs(res.prefs);
      setEmail(res.email);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!prefs) return;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await saveEmailPreferencesByTokenAction({
        token,
        email: prefs.email,
        categoryFrequencies: prefs.categoryFrequencies,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
    });
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-sm text-brand-ink/70">
        Loading preferences…
      </main>
    );
  }

  if (error && !prefs) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-xl font-semibold text-brand-ink mb-2">Email preferences</h1>
        <p className="text-sm text-red-600">{error}</p>
      </main>
    );
  }

  if (!prefs) return null;

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold text-brand-ink mb-2">Mission Hub email preferences</h1>
      <p className="text-sm text-brand-ink/60 mb-6">
        Manage email for <span className="font-medium">{email}</span>. These settings apply to
        Mission Hub only — not Mail Suite newsletters.
      </p>
      <form onSubmit={handleSave} className="space-y-6 rounded-xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <EmailChannelToggle prefs={prefs} onChange={setPrefs} />
        <EmailCategoryFrequencyFields prefs={prefs} onChange={setPrefs} />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {saved ? (
          <p className="text-sm text-emerald-700">Preferences saved.</p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save preferences"}
        </Button>
      </form>
    </main>
  );
}

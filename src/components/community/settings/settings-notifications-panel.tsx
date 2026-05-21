"use client";

import { useState, useTransition } from "react";
import { saveNotificationPrefsAction } from "@/app/(storefront)/community/settings-actions";
import {
  NOTIFICATION_PREF_KEYS,
  NOTIFICATION_PREF_LABELS,
  type NotificationPreferences,
  type SettingsPageData,
} from "@/lib/community/settings-types";
import {
  SettingsComingSoon,
  SettingsFieldGroup,
  SettingsPanel,
  SettingsSaveButton,
  SettingsToggleRow,
} from "./settings-ui";

export function SettingsNotificationsPanel({ data }: { data: SettingsPageData }) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(data.notificationPrefs);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function setKey<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveNotificationPrefsAction(prefs);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <SettingsPanel
        title="Notifications"
        description="Choose what activity you want to hear about in Mission Hub."
        footer={<SettingsSaveButton pending={pending} />}
      >
        <SettingsFieldGroup>
          <div className="space-y-4 pb-2 border-b border-black/[0.04]">
            <p className="text-xs font-semibold text-brand-ink/50 uppercase tracking-wide">
              Channels
            </p>
            <SettingsToggleRow
              label="In-app notifications"
              description="Bell icon and activity list in Mission Hub."
              checked={prefs.inApp}
              onChange={(v) => setKey("inApp", v)}
            />
            <SettingsToggleRow
              label="Email"
              checked={prefs.email}
              onChange={(v) => setKey("email", v)}
              disabled
            />
            <SettingsComingSoon>Email digests — coming soon</SettingsComingSoon>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold text-brand-ink/50 uppercase tracking-wide">
              Activity
            </p>
            {NOTIFICATION_PREF_KEYS.map((key) => (
              <SettingsToggleRow
                key={key}
                label={NOTIFICATION_PREF_LABELS[key].label}
                description={NOTIFICATION_PREF_LABELS[key].description}
                checked={prefs[key]}
                onChange={(v) => setKey(key, v)}
              />
            ))}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </SettingsFieldGroup>
      </SettingsPanel>
    </form>
  );
}

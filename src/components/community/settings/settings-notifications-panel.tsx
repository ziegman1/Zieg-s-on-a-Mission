"use client";

import { useState, useTransition } from "react";
import { saveNotificationPrefsAction } from "@/app/(storefront)/community/settings-actions";
import { toggleMutedSpace } from "@/lib/community/notification-preferences";
import {
  NOTIFICATION_CHANNEL_LABELS,
  type NotificationPreferences,
  type SettingsPageData,
} from "@/lib/community/settings-types";
import {
  EmailCategoryFrequencyFields,
  EmailChannelToggle,
} from "@/components/community/email-preferences-form";
import {
  SettingsFieldGroup,
  SettingsPanel,
  SettingsSaveButton,
  SettingsToggleRow,
} from "./settings-ui";

export function SettingsNotificationsPanel({ data }: { data: SettingsPageData }) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(data.notificationPrefs);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await saveNotificationPrefsAction(prefs);
      if (!res.ok) setError(res.error);
    });
  }

  const mutedSet = new Set(prefs.mutedSpaceIds ?? []);

  return (
    <form onSubmit={handleSubmit}>
      <SettingsPanel
        title="Notifications"
        description="Choose how Mission Hub keeps you updated. Mission Hub email preferences are separate from Mail Suite."
        footer={<SettingsSaveButton pending={pending} />}
      >
        <SettingsFieldGroup>
          <div className="space-y-4 pb-2 border-b border-black/[0.04]">
            <p className="text-xs font-semibold text-brand-ink/50 uppercase tracking-wide">
              Channels
            </p>
            <SettingsToggleRow
              label={NOTIFICATION_CHANNEL_LABELS.inApp.label}
              description={NOTIFICATION_CHANNEL_LABELS.inApp.description}
              checked={prefs.inApp}
              onChange={(v) => setPrefs((p) => ({ ...p, inApp: v }))}
            />
            <EmailChannelToggle prefs={prefs} onChange={setPrefs} />
            <SettingsToggleRow
              label={NOTIFICATION_CHANNEL_LABELS.push.label}
              description={NOTIFICATION_CHANNEL_LABELS.push.description}
              checked={prefs.push}
              onChange={(v) => setPrefs((p) => ({ ...p, push: v }))}
              disabled
            />
          </div>

          <div className="space-y-4 pb-2 border-b border-black/[0.04]">
            <p className="text-xs font-semibold text-brand-ink/50 uppercase tracking-wide">
              Email categories & frequency
            </p>
            <EmailCategoryFrequencyFields prefs={prefs} onChange={setPrefs} />
          </div>

          {data.muteableSpaces.length > 0 ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-brand-ink/50 uppercase tracking-wide">
                Muted spaces
              </p>
              <p className="text-xs text-brand-ink/50 leading-relaxed">
                Pause notifications tied to a space (including newsletter announcements in Ministry
                Updates).
              </p>
              {data.muteableSpaces.map((space) => (
                <SettingsToggleRow
                  key={space.id}
                  label={space.title}
                  description={`/${space.slug}`}
                  checked={mutedSet.has(space.id)}
                  onChange={(muted) => setPrefs((p) => toggleMutedSpace(p, space.id, muted))}
                />
              ))}
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </SettingsFieldGroup>
      </SettingsPanel>
    </form>
  );
}

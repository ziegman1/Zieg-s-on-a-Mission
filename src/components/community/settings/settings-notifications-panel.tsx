"use client";

import { useState, useTransition } from "react";
import { saveNotificationPrefsAction } from "@/app/(storefront)/community/settings-actions";
import { toggleMutedSpace } from "@/lib/community/notification-preferences";
import {
  NOTIFICATION_CHANNEL_LABELS,
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

const CONTENT_PREF_KEYS = NOTIFICATION_PREF_KEYS.filter(
  (k) =>
    k === "newPosts" ||
    k === "ministryUpdates" ||
    k === "newsletters" ||
    k === "weeklyDigest" ||
    k === "commentsOnPosts" ||
    k === "repliesToComments" ||
    k === "prayerResponses" ||
    k === "praiseReports",
);

const PRIMARY_CONTENT_KEYS = ["newPosts", "ministryUpdates", "newsletters", "weeklyDigest"] as const;

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

  const mutedSet = new Set(prefs.mutedSpaceIds ?? []);

  return (
    <form onSubmit={handleSubmit}>
      <SettingsPanel
        title="Notifications"
        description="Choose how Mission Hub keeps you updated. Delivery is being prepared — your choices are saved now."
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
              onChange={(v) => setKey("inApp", v)}
            />
            <SettingsToggleRow
              label={NOTIFICATION_CHANNEL_LABELS.email.label}
              description={NOTIFICATION_CHANNEL_LABELS.email.description}
              checked={prefs.email}
              onChange={(v) => setKey("email", v)}
            />
            <SettingsToggleRow
              label={NOTIFICATION_CHANNEL_LABELS.push.label}
              description={NOTIFICATION_CHANNEL_LABELS.push.description}
              checked={prefs.push}
              onChange={(v) => setKey("push", v)}
              disabled
            />
            <SettingsComingSoon>Push delivery — coming with the mobile app</SettingsComingSoon>
          </div>

          <div className="space-y-4 pb-2 border-b border-black/[0.04]">
            <p className="text-xs font-semibold text-brand-ink/50 uppercase tracking-wide">
              Mission Hub content
            </p>
            {PRIMARY_CONTENT_KEYS.map((key) => (
              <SettingsToggleRow
                key={key}
                label={NOTIFICATION_PREF_LABELS[key].label}
                description={NOTIFICATION_PREF_LABELS[key].description}
                checked={prefs[key]}
                onChange={(v) => setKey(key, v)}
              />
            ))}
          </div>

          <div className="space-y-4 pb-2 border-b border-black/[0.04]">
            <p className="text-xs font-semibold text-brand-ink/50 uppercase tracking-wide">
              Activity
            </p>
            {CONTENT_PREF_KEYS.filter(
              (k) => !(PRIMARY_CONTENT_KEYS as readonly string[]).includes(k),
            ).map((key) => (
              <SettingsToggleRow
                key={key}
                label={NOTIFICATION_PREF_LABELS[key].label}
                description={NOTIFICATION_PREF_LABELS[key].description}
                checked={prefs[key]}
                onChange={(v) => setKey(key, v)}
              />
            ))}
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

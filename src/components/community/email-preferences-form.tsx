"use client";

import {
  MISSION_HUB_EMAIL_CATEGORIES,
  MISSION_HUB_EMAIL_CATEGORY_LABELS,
  NOTIFICATION_FREQUENCY_LABELS,
  NOTIFICATION_FREQUENCIES,
  type MissionHubEmailCategory,
  type NotificationFrequency,
} from "@/lib/mission-hub/notification-category-preferences";
import type { NotificationPreferences } from "@/lib/community/settings-types";
import { Label } from "@/components/ui/label";
import { SettingsToggleRow } from "./settings/settings-ui";

export function EmailCategoryFrequencyFields({
  prefs,
  onChange,
  disabled,
}: {
  prefs: NotificationPreferences;
  onChange: (next: NotificationPreferences) => void;
  disabled?: boolean;
}) {
  function setFrequency(category: MissionHubEmailCategory, frequency: NotificationFrequency) {
    onChange({
      ...prefs,
      categoryFrequencies: {
        ...prefs.categoryFrequencies,
        [category]: frequency,
      },
    });
  }

  return (
    <div className="space-y-4">
      {MISSION_HUB_EMAIL_CATEGORIES.map((category) => (
        <div key={category} className="space-y-1.5">
          <Label htmlFor={`freq-${category}`}>
            {MISSION_HUB_EMAIL_CATEGORY_LABELS[category].label}
          </Label>
          <p className="text-[11px] text-brand-ink/50 leading-relaxed">
            {MISSION_HUB_EMAIL_CATEGORY_LABELS[category].description}
          </p>
          <select
            id={`freq-${category}`}
            value={prefs.categoryFrequencies[category]}
            disabled={disabled || prefs.email === false}
            onChange={(e) =>
              setFrequency(category, e.target.value as NotificationFrequency)
            }
            className="h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
          >
            {NOTIFICATION_FREQUENCIES.map((frequency) => (
              <option key={frequency} value={frequency}>
                {NOTIFICATION_FREQUENCY_LABELS[frequency].label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

export function EmailChannelToggle({
  prefs,
  onChange,
  disabled,
}: {
  prefs: NotificationPreferences;
  onChange: (next: NotificationPreferences) => void;
  disabled?: boolean;
}) {
  return (
    <SettingsToggleRow
      label="Email notifications"
      description="Master switch for Mission Hub email (does not affect Mail Suite)."
      checked={prefs.email}
      disabled={disabled}
      onChange={(email) => onChange({ ...prefs, email })}
    />
  );
}

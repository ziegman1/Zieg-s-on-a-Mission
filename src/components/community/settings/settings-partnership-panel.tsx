"use client";

import { useState, useTransition } from "react";
import { savePartnershipPreferencesAction } from "@/app/(storefront)/community/partnership-actions";
import type { SettingsPageData } from "@/lib/community/settings-types";
import { MissionHubPartnershipForm } from "../mission-hub-partnership-form";
import { SettingsPanel } from "./settings-ui";

export function SettingsPartnershipPanel({ data }: { data: SettingsPageData }) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <SettingsPanel
      title="Partnership in the mission"
      description="Choose how you'd like to walk with us — updates, prayer, advocacy, and giving opportunities."
    >
      {saved ? (
        <p className="text-xs text-brand-primary font-medium mb-3">Preferences saved.</p>
      ) : null}
      <MissionHubPartnershipForm
        initialPrefs={data.partnershipPrefs}
        pending={pending}
        error={error}
        submitLabel="Save preferences"
        idPrefix="settings-partnership"
        onSubmit={(selection) => {
          setError(null);
          setSaved(false);
          startTransition(async () => {
            const res = await savePartnershipPreferencesAction(selection);
            if (!res.ok) {
              setError(res.error);
              return;
            }
            setSaved(true);
          });
        }}
      />
    </SettingsPanel>
  );
}

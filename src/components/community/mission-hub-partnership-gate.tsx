"use client";

import { useState } from "react";
import type { PartnershipPreferences } from "@/lib/community/partnership-preferences";
import { MissionHubPartnershipOnboarding } from "./mission-hub-partnership-onboarding";

export function MissionHubPartnershipGate({
  needsOnboarding,
  initialPrefs = null,
  children,
}: {
  needsOnboarding: boolean;
  initialPrefs?: PartnershipPreferences | null;
  children: React.ReactNode;
}) {
  const [dismissed, setDismissed] = useState(false);
  const show = needsOnboarding && !dismissed;

  return (
    <>
      {children}
      <MissionHubPartnershipOnboarding
        open={show}
        initialPrefs={initialPrefs}
        onCompleted={() => setDismissed(true)}
      />
    </>
  );
}

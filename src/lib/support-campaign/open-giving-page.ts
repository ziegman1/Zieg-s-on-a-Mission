import { CAMPAIGN_GIVING_URL } from "@/data/support-campaign-config";

/** Open a blank tab synchronously on click so popup blockers allow navigation after async work. */
export function prepareCampaignGivingPage(): Window | null {
  try {
    return window.open("about:blank", "_blank", "noopener,noreferrer");
  } catch {
    return null;
  }
}

export function openCampaignGivingPage(prepared?: Window | null): void {
  if (prepared && !prepared.closed) {
    prepared.location.href = CAMPAIGN_GIVING_URL;
    prepared.focus?.();
    return;
  }

  const opened = window.open(CAMPAIGN_GIVING_URL, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.assign(CAMPAIGN_GIVING_URL);
  }
}

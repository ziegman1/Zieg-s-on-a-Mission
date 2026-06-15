import { CAMPAIGN } from "@/data/support-campaign-config";

export type CampaignCountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export type CampaignCountdownState =
  | { active: true; remaining: CampaignCountdownParts }
  | { active: false };

export function getCampaignStartTime(): number {
  return Date.parse(CAMPAIGN.startDate);
}

export function getCampaignEndTime(): number {
  return Date.parse(CAMPAIGN.endDate);
}

export function getCampaignDurationMs(): number {
  const start = getCampaignStartTime();
  const end = getCampaignEndTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return end - start;
}

export function isCampaignActive(now = Date.now()): boolean {
  const start = getCampaignStartTime();
  const end = getCampaignEndTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  return now >= start && now < end;
}

function msToCountdownParts(ms: number): CampaignCountdownParts {
  let totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

/**
 * Remaining time until CAMPAIGN.endDate.
 * Before start, shows the full campaign window (7 days at launch).
 */
export function getCampaignCountdown(now = Date.now()): CampaignCountdownState {
  const start = getCampaignStartTime();
  const end = getCampaignEndTime();
  if (Number.isNaN(start) || Number.isNaN(end) || now >= end) {
    return { active: false };
  }

  const remainingMs = now < start ? end - start : end - now;

  return {
    active: true,
    remaining: msToCountdownParts(remainingMs),
  };
}

export function padCountdownUnit(value: number): string {
  return String(Math.max(0, value)).padStart(2, "0");
}

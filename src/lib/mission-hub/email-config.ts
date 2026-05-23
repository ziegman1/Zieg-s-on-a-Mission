import "server-only";

import { LEGAL_CONFIG } from "@/data/legal-config";

export type MissionHubEmailConfigProblem =
  | "disabled"
  | "missing_resend_key"
  | "missing_from_email";

/** Feature flag — Mission Hub notification emails (not Mail Suite). */
export function isMissionHubEmailNotificationsEnabled(): boolean {
  return process.env.ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS === "true";
}

export function getMissionHubFromName(): string {
  return (
    process.env.MISSION_HUB_FROM_NAME?.trim() ||
    "Zieg's on a Mission"
  );
}

export function getMissionHubFromEmail(): string {
  return (
    process.env.MISSION_HUB_FROM_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.trim()?.match(/<([^>]+)>/)?.[1] ||
    "hello@ziegsonamission.com"
  );
}

export function getMissionHubReplyToEmail(): string | undefined {
  const v =
    process.env.MISSION_HUB_REPLY_TO_EMAIL?.trim() ||
    LEGAL_CONFIG.supportEmail;
  return v || undefined;
}

export function formatMissionHubFromHeader(): string {
  return `${getMissionHubFromName()} <${getMissionHubFromEmail()}>`;
}

export function getMissionHubEmailConfigProblem(): MissionHubEmailConfigProblem | null {
  if (!isMissionHubEmailNotificationsEnabled()) return "disabled";
  if (!process.env.RESEND_API_KEY?.trim()) return "missing_resend_key";
  if (!getMissionHubFromEmail()) return "missing_from_email";
  return null;
}

export function missionHubEmailDisabledMessage(
  problem: MissionHubEmailConfigProblem,
): string {
  switch (problem) {
    case "disabled":
      return "Mission Hub email notifications are disabled (ENABLE_MISSION_HUB_EMAIL_NOTIFICATIONS).";
    case "missing_resend_key":
      return "Mission Hub email notifications skipped: RESEND_API_KEY is not set.";
    case "missing_from_email":
      return "Mission Hub email notifications skipped: MISSION_HUB_FROM_EMAIL is not set.";
  }
}

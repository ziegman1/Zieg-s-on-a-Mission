import { MISSION_HUB_ACTIVE_POLL_MS } from "@/lib/community/mission-hub-refresh";

/**
 * Poll interval while Mission Hub is open.
 * Returns 0 when hidden (pause polling).
 */
export function missionHubPollIntervalMs(documentVisible: boolean): number {
  if (!documentVisible) return 0;
  return MISSION_HUB_ACTIVE_POLL_MS;
}

export function shouldPollMissionHub(documentVisible: boolean): boolean {
  return documentVisible && missionHubPollIntervalMs(documentVisible) > 0;
}

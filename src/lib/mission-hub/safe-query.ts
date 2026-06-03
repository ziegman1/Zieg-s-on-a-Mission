import {
  logMissionHubDiag,
  type MissionHubDiagSubsystem,
} from "@/lib/mission-hub/diagnostics-log";

/** Run a Mission Hub query; log failures and return fallback instead of throwing. */
export async function safeMissionHubQuery<T>(
  subsystem: MissionHubDiagSubsystem,
  label: string,
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  logMissionHubDiag(subsystem, "start", label);
  try {
    const result = await fn();
    logMissionHubDiag(subsystem, "ok", label);
    return result;
  } catch (error) {
    logMissionHubDiag(subsystem, "error", label, error);
    return fallback;
  }
}

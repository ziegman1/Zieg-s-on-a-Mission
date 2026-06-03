/** Structured Mission Hub diagnostics — grep Vercel logs for `[mission-hub-diag]`. */

export type MissionHubDiagSubsystem =
  | "layout"
  | "community-page"
  | "community-space-page"
  | "notifications"
  | "notification-actions"
  | "hub-refresh"
  | "realtime-bridge"
  | "spaces"
  | "feed"
  | "prayer-room"
  | "blog-articles"
  | "health";

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ""}`;
  }
  return String(error);
}

export function logMissionHubDiag(
  subsystem: MissionHubDiagSubsystem,
  phase: "start" | "ok" | "error",
  detail?: Record<string, unknown> | string,
  error?: unknown,
): void {
  const payload: Record<string, unknown> = {
    subsystem,
    phase,
    at: new Date().toISOString(),
  };
  if (detail !== undefined) {
    payload.detail = detail;
  }
  if (error !== undefined) {
    payload.error = formatError(error);
  }

  if (phase === "error") {
    console.error("[mission-hub-diag]", payload);
  } else if (process.env.MISSION_HUB_DIAG === "1" || process.env.NODE_ENV !== "production") {
    console.info("[mission-hub-diag]", payload);
  }
}

export function missionHubDiagErrorMessage(error: unknown): string {
  return formatError(error);
}

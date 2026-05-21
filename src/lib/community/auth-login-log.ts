/** Dev-only Mission Hub login diagnostics (set AUTH_DEBUG=1 in any environment). */

export function logMissionHubLogin(payload: {
  email: string;
  role?: string | null;
  success: boolean;
  error?: string | null;
  callbackUrl?: string;
  context?: string;
}): void {
  if (process.env.NODE_ENV !== "development" && process.env.AUTH_DEBUG !== "1") {
    return;
  }
  console.log("[MissionHub login]", payload);
}

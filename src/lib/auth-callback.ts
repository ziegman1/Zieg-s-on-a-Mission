/** Safe post-login redirect paths (same-origin, no open redirects). */

export const AUTH_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export function safeCallbackUrl(raw: unknown, fallback = "/admin"): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return fallback;
  }
  return raw;
}

export function buildOwnerLoginUrl(returnPath: string): string {
  const path = safeCallbackUrl(returnPath, "/community");
  return `/admin/login?callbackUrl=${encodeURIComponent(path)}`;
}

export function isMissionHubReturnPath(path: string): boolean {
  return path === "/community" || path.startsWith("/community/");
}

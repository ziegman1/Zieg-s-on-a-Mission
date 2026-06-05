import { safeCallbackUrl } from "@/lib/auth-callback";
import { missionHubPostHashFromLocation } from "@/lib/community/mission-hub-scroll";

/** Fallback when hub settings omit welcomePostPath. */
export const DEFAULT_WELCOME_POST_PATH = "/community/start-here";

export const MISSION_HUB_AUTH_CALLBACK_STORAGE_KEY = "mission-hub-auth-callback";

export const WELCOME_INTRO_OPEN_COMMENTS_PARAM = "openComments";

export function isDefaultMissionHubAuthCallback(raw: unknown): boolean {
  return safeCallbackUrl(raw, "/community") === "/community";
}

/** Whether to redirect to the welcome post after partnership onboarding saves. */
export function shouldRedirectToWelcomeIntro(input: {
  welcomeIntroCompleted: boolean;
  wasOnboardingPending: boolean;
  authCallbackUrl: unknown;
}): boolean {
  if (input.welcomeIntroCompleted) return false;
  if (!input.wasOnboardingPending) return false;
  if (input.authCallbackUrl == null || input.authCallbackUrl === "") return false;
  return isDefaultMissionHubAuthCallback(input.authCallbackUrl);
}

/**
 * Normalize a hub-configured welcome path (pathname + optional #post- hash).
 * Rejects open redirects and non-community paths.
 */
export function normalizeWelcomePostPath(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let pathPart = trimmed;
  let hash = "";
  const hashIndex = trimmed.indexOf("#");
  if (hashIndex >= 0) {
    pathPart = trimmed.slice(0, hashIndex);
    hash = trimmed.slice(hashIndex);
  }

  const pathname = safeCallbackUrl(pathPart, "");
  if (!pathname || !pathname.startsWith("/community")) return null;
  if (hash && !/^#post-[a-zA-Z0-9_-]+$/.test(hash)) return null;

  return `${pathname}${hash}`;
}

export function resolveWelcomePostPath(configured: string | null | undefined): string {
  return normalizeWelcomePostPath(configured) ?? DEFAULT_WELCOME_POST_PATH;
}

/** Build redirect URL with openComments=1 for post-hash welcome paths. */
export function buildWelcomeIntroRedirectUrl(welcomePostPath: string): string {
  const normalized = normalizeWelcomePostPath(welcomePostPath) ?? DEFAULT_WELCOME_POST_PATH;

  let pathname = normalized;
  let hash = "";
  const hashIndex = normalized.indexOf("#");
  if (hashIndex >= 0) {
    pathname = normalized.slice(0, hashIndex);
    hash = normalized.slice(hashIndex);
  }

  const url = new URL(pathname, "https://placeholder.local");
  url.searchParams.set(WELCOME_INTRO_OPEN_COMMENTS_PARAM, "1");
  return `${url.pathname}?${url.searchParams.toString()}${hash}`;
}

export function readWelcomeIntroOpenCommentsFromSearch(search: string): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return params.get(WELCOME_INTRO_OPEN_COMMENTS_PARAM) === "1";
}

export function stripWelcomeIntroOpenCommentsFromUrl(href: string): string {
  const url = new URL(href, "https://placeholder.local");
  url.searchParams.delete(WELCOME_INTRO_OPEN_COMMENTS_PARAM);
  const qs = url.searchParams.toString();
  return `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`;
}

/** True when URL requests auto-open comments for this post id. */
export function shouldAutoOpenWelcomeComments(input: {
  postId: string;
  search: string;
  hash: string;
}): boolean {
  if (!readWelcomeIntroOpenCommentsFromSearch(input.search)) return false;
  const hashPostId = missionHubPostHashFromLocation(input.hash);
  if (hashPostId) return hashPostId === input.postId;
  return false;
}

export function storeMissionHubAuthCallback(callbackUrl: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      MISSION_HUB_AUTH_CALLBACK_STORAGE_KEY,
      safeCallbackUrl(callbackUrl, "/community"),
    );
  } catch {
    // private mode / quota
  }
}

export function readMissionHubAuthCallback(): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(MISSION_HUB_AUTH_CALLBACK_STORAGE_KEY);
  } catch {
    return null;
  }
}

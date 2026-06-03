/** Mission Hub client refresh — events, timing, and pathname helpers. */

export const MISSION_HUB_REFRESH_EVENT = "mission-hub:refresh";
export const MISSION_HUB_NOTIFICATIONS_SYNC_EVENT = "mission-hub:notifications-sync";

/** Active tab polling (45s). */
export const MISSION_HUB_ACTIVE_POLL_MS = 45_000;
/** Minimum gap between full refresh cycles (debounce duplicate fetches). */
export const MISSION_HUB_REFRESH_DEBOUNCE_MS = 900;
/** Pull distance (px) before release triggers refresh. */
export const MISSION_HUB_PTR_TRIGGER_PX = 72;
/** Max pull indicator travel (px). */
export const MISSION_HUB_PTR_MAX_PULL_PX = 120;

export type MissionHubRefreshSource =
  | "pull"
  | "focus"
  | "poll"
  | "realtime"
  | "banner"
  | "manual";

export type MissionHubRefreshDetail = {
  source: MissionHubRefreshSource;
  /** When true, always router.refresh even if fingerprint unchanged. */
  force?: boolean;
};

export function dispatchMissionHubRefresh(detail: MissionHubRefreshDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<MissionHubRefreshDetail>(MISSION_HUB_REFRESH_EVENT, { detail }),
  );
}

export function dispatchMissionHubNotificationsSync(unreadCount: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<{ unreadCount: number }>(MISSION_HUB_NOTIFICATIONS_SYNC_EVENT, {
      detail: { unreadCount },
    }),
  );
}

/** Paths that use the post feed fingerprint (home + space feeds). */
export function missionHubFeedPathFromPathname(pathname: string): {
  isFeedRoute: boolean;
  spaceSlug: string | null;
} {
  if (!pathname.startsWith("/community")) {
    return { isFeedRoute: false, spaceSlug: null };
  }
  if (
    pathname === "/community" ||
    pathname === "/community/" ||
    pathname.startsWith("/community/login") ||
    pathname.startsWith("/community/join") ||
    pathname.startsWith("/community/settings") ||
    pathname === "/community/spaces" ||
    pathname.startsWith("/community/profile")
  ) {
    const isHome = pathname === "/community" || pathname === "/community/";
    return { isFeedRoute: isHome, spaceSlug: null };
  }
  const slug = pathname.replace(/^\/community\//, "").split("/")[0]?.trim();
  if (!slug) return { isFeedRoute: false, spaceSlug: null };
  return { isFeedRoute: true, spaceSlug: slug.toLowerCase() };
}

export function shouldAllowMissionHubRefresh(
  lastRefreshAt: number,
  now: number,
  force?: boolean,
): boolean {
  if (force) return true;
  return now - lastRefreshAt >= MISSION_HUB_REFRESH_DEBOUNCE_MS;
}

/**
 * Only re-fetch RSC payloads when the user explicitly refreshes or opts in.
 * Focus/poll/realtime update badges and the "new posts" banner without router.refresh()
 * so a transient SSR error cannot crash the whole Mission Hub shell.
 */
export function shouldRouterRefreshAfterSnapshot(
  source: MissionHubRefreshSource,
  opts?: { force?: boolean },
): boolean {
  if (opts?.force) return true;
  return source === "pull" || source === "banner" || source === "manual";
}

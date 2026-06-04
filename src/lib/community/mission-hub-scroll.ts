import { isSpiritualRoom } from "@/lib/community/spiritual-room";

/** Mission Hub feed scroll policy — avoid jumping on initial load. */

export type MissionHubLandingMode = "hero" | "latestPost" | "none";

export type MissionHubScrollContext = {
  /** True when the user explicitly tapped a control (View Requests, Comment, etc.). */
  userInitiated: boolean;
  /** Current route pathname, e.g. `/community` or `/community/prayer-and-praise-room`. */
  pathname?: string;
  /** Space slug when on a space page. */
  spaceSlug?: string | null;
  /** Space uses a welcome/hero image at the top. */
  hasWelcomeHero?: boolean;
  /** URL hash targets a post anchor, e.g. `#post-abc`. */
  hashTargetsPost?: boolean;
};

export type SpaceLandingProfile = {
  slug: string;
  spaceType?: string;
  coverImageUrl?: string | null;
  showWelcomeMessage?: boolean;
  welcomeMessage?: string | null;
};

const PRAYER_ROOM_SLUG = "prayer-and-praise-room";

/** Sticky top bar + safe area — matches post `scroll-mt-[5.5rem]`. */
export const MISSION_HUB_LANDING_STICKY_OFFSET_PX = 88;

const LANDING_NONE_PATH_PREFIXES = [
  "/community/login",
  "/community/join",
  "/community/settings",
  "/community/profile",
  "/community/spaces",
] as const;

/**
 * Whether a space should land at the hero/welcome image (not the latest post).
 */
export function spaceShouldLandAtHero(space: SpaceLandingProfile): boolean {
  const slug = space.slug.trim().toLowerCase();
  if (slug === PRAYER_ROOM_SLUG) return true;
  if (isSpiritualRoom(space.spaceType ?? "", slug)) return true;
  if (space.coverImageUrl?.trim()) return true;
  return false;
}

export function missionHubPathHasWelcomeHero(
  pathname: string,
  spaceSlug?: string | null,
): boolean {
  const slug =
    spaceSlug ??
    (pathname.startsWith("/community/") ? pathname.split("/")[2] ?? null : null);
  if (!slug) return false;
  return slug === PRAYER_ROOM_SLUG || isSpiritualRoom("", slug);
}

export function resolveMissionHubLandingMode(
  pathname: string,
  options: {
    space?: SpaceLandingProfile | null;
    latestPostId?: string | null;
  } = {},
): MissionHubLandingMode {
  const normalized = pathname.replace(/\/$/, "") || "/community";

  if (!normalized.startsWith("/community")) return "none";
  if (LANDING_NONE_PATH_PREFIXES.some((p) => normalized === p || normalized.startsWith(`${p}/`))) {
    return "none";
  }

  if (normalized === "/community") {
    return options.latestPostId ? "latestPost" : "none";
  }

  if (normalized.startsWith("/community/")) {
    const slug = normalized.split("/")[2] ?? "";
    if (!slug) return "none";

    const space =
      options.space ??
      ({
        slug,
      } satisfies SpaceLandingProfile);

    if (spaceShouldLandAtHero(space)) return "hero";
    return options.latestPostId ? "latestPost" : "none";
  }

  return "none";
}

export function missionHubLandingRouteKey(pathname: string, latestPostId?: string | null): string {
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  return `${pathname.replace(/\/$/, "")}|${latestPostId ?? ""}|${hash}`;
}

export function shouldSkipInitialLandingScroll(input: {
  hash?: string;
  userScrolled?: boolean;
  mode: MissionHubLandingMode;
}): boolean {
  if (missionHubPostHashFromLocation(input.hash ?? "")) return true;
  if (input.userScrolled) return true;
  if (input.mode === "none") return true;
  return false;
}

/**
 * Whether programmatic scroll-to-feed is allowed (user tapped View Requests, etc.).
 */
export function shouldAutoScrollToFeed(ctx: MissionHubScrollContext): boolean {
  if (ctx.hashTargetsPost) return true;
  if (!ctx.userInitiated) return false;
  if (ctx.hasWelcomeHero) return true;
  return true;
}

/** Scroll the window to a feed anchor element (user-initiated actions only). */
export function scrollMissionHubFeedIntoView(
  element: HTMLElement | null,
  opts: { behavior?: ScrollBehavior } = {},
): void {
  if (!element) return;
  element.scrollIntoView({
    behavior: opts.behavior ?? "smooth",
    block: "start",
  });
}

/** Whether the latest post card is already visible below the sticky header. */
export function isPostAnchorMostlyVisible(
  postId: string,
  stickyOffsetPx = MISSION_HUB_LANDING_STICKY_OFFSET_PX,
): boolean {
  if (typeof document === "undefined") return true;
  const el = document.getElementById(`post-${postId}`);
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const viewportBottom = window.innerHeight;
  return rect.top >= stickyOffsetPx - 12 && rect.top < viewportBottom - 48;
}

/** Initial landing: bring the latest post into view without redundant motion. */
export function scrollLatestPostIntoView(
  postId: string,
  opts: { behavior?: ScrollBehavior; stickyOffsetPx?: number } = {},
): boolean {
  if (typeof document === "undefined") return false;
  if (isPostAnchorMostlyVisible(postId, opts.stickyOffsetPx)) return false;
  const el = document.getElementById(`post-${postId}`);
  if (!el) return false;
  el.scrollIntoView({
    behavior: opts.behavior ?? "instant",
    block: "start",
  });
  return true;
}

/** Scroll to a post card when the URL hash or user action targets it. */
export function scrollMissionHubPostIntoView(
  postId: string,
  opts: { behavior?: ScrollBehavior; userInitiated?: boolean; hashNavigation?: boolean } = {},
): boolean {
  if (!opts.userInitiated && !opts.hashNavigation) return false;
  const el = document.getElementById(`post-${postId}`);
  if (!el) return false;
  el.scrollIntoView({
    behavior: opts.behavior ?? "smooth",
    block: "nearest",
  });
  return true;
}

export function missionHubPostHashFromLocation(hash: string): string | null {
  const match = /^#post-(.+)$/.exec(hash.trim());
  return match?.[1]?.trim() || null;
}

export function scrollMissionHubToTop(behavior: ScrollBehavior = "instant"): void {
  if (typeof window === "undefined") return;
  window.scrollTo({ top: 0, left: 0, behavior });
}

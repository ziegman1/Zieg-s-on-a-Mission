/** Mission Hub feed scroll policy — avoid jumping on initial load. */

export type MissionHubScrollContext = {
  /** True when the user explicitly tapped a control (View Requests, Comment, etc.). */
  userInitiated: boolean;
  /** Current route pathname, e.g. `/community` or `/community/prayer-and-praise-room`. */
  pathname?: string;
  /** Space slug when on a space page. */
  spaceSlug?: string | null;
  /** Prayer Room and similar spaces with a welcome hero image. */
  hasWelcomeHero?: boolean;
  /** URL hash targets a post anchor, e.g. `#post-abc`. */
  hashTargetsPost?: boolean;
};

const PRAYER_ROOM_SLUG = "prayer-and-praise-room";

export function missionHubPathHasWelcomeHero(
  pathname: string,
  spaceSlug?: string | null,
): boolean {
  const slug =
    spaceSlug ??
    (pathname.startsWith("/community/") ? pathname.split("/")[2] ?? null : null);
  return slug === PRAYER_ROOM_SLUG;
}

/**
 * Whether programmatic scroll-to-feed is allowed.
 * Initial page load must never auto-scroll unless navigating to a post hash.
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

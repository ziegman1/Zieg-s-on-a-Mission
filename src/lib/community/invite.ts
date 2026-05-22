import { safeCallbackUrl } from "@/lib/auth-callback";
import { isPrayerSpaceSlug } from "@/lib/community/space-interaction";

const RESERVED_SLUGS = new Set([
  "login",
  "join",
  "profile",
  "spaces",
  "settings",
]);

export const DEFAULT_INVITE_MESSAGE =
  "Come join us in Mission Hub as we pray, share updates, and walk together in God's mission.";

export const PRAYER_ROOM_INVITE_MESSAGE =
  "Come join us in the Prayer & Praise Room as we pray together and celebrate what God is doing.";

export type InviteContextKind = "hub" | "spaces" | "space";

export type InviteContext = {
  kind: InviteContextKind;
  /** Path after join/login (destination). */
  targetPath: string;
  spaceSlug: string | null;
  isPrayerRoom: boolean;
  message: string;
  shareTitle: string;
  sheetDescription: string;
};

export function missionHubSiteOrigin(fallbackOrigin?: string): string {
  if (fallbackOrigin) return fallbackOrigin.replace(/\/$/, "");
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, "");
  return "https://ziegsonamission.com";
}

function formatSpaceTitle(slug: string): string {
  if (isPrayerSpaceSlug(slug)) return "Prayer & Praise Room";
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Resolve invite destination and copy from the current Mission Hub pathname. */
export function resolveInviteContext(pathname: string): InviteContext {
  const isPrayerRoom = (slug: string | null) => Boolean(slug && isPrayerSpaceSlug(slug));

  if (pathname === "/community/spaces") {
    return {
      kind: "spaces",
      targetPath: "/community/spaces",
      spaceSlug: null,
      isPrayerRoom: false,
      message: DEFAULT_INVITE_MESSAGE,
      shareTitle: "Join us in Mission Hub",
      sheetDescription: "Invite someone to explore Mission Hub spaces.",
    };
  }

  if (pathname.startsWith("/community/")) {
    const slug = pathname.split("/")[2];
    if (slug && !RESERVED_SLUGS.has(slug)) {
      const prayer = isPrayerRoom(slug);
      const title = formatSpaceTitle(slug);
      return {
        kind: "space",
        targetPath: `/community/${slug}`,
        spaceSlug: slug,
        isPrayerRoom: prayer,
        message: prayer ? PRAYER_ROOM_INVITE_MESSAGE : DEFAULT_INVITE_MESSAGE,
        shareTitle: prayer ? "Join us in Prayer & Praise" : `Join us in ${title}`,
        sheetDescription: prayer
          ? "Invite someone to the Prayer & Praise Room."
          : `Invite someone to ${title}.`,
      };
    }
  }

  return {
    kind: "hub",
    targetPath: "/community",
    spaceSlug: null,
    isPrayerRoom: false,
    message: DEFAULT_INVITE_MESSAGE,
    shareTitle: "Join us in Mission Hub",
    sheetDescription: "Invite someone to Mission Hub home.",
  };
}

/** Join URL so new members land on the invited destination after sign-up. */
export function buildInviteJoinPath(targetPath: string): string {
  const callback = safeCallbackUrl(targetPath, "/community");
  return `/community/join?callbackUrl=${encodeURIComponent(callback)}`;
}

export function buildInviteJoinUrl(origin: string, targetPath: string): string {
  const base = missionHubSiteOrigin(origin);
  return `${base}${buildInviteJoinPath(targetPath)}`;
}

export function buildInviteShareText(message: string, inviteUrl: string): string {
  return `${message}\n\n${inviteUrl}`;
}

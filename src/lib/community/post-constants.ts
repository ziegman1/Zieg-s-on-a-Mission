import type { CommunityPostDbStatus, CommunityPostType } from "@/lib/community/types";

export const COMMUNITY_POST_STATUSES: CommunityPostDbStatus[] = ["draft", "published", "archived"];

export const COMMUNITY_POST_TYPES: { value: CommunityPostType; label: string }[] = [
  { value: "prayer", label: "Prayer" },
  { value: "praise", label: "Praise" },
  { value: "encouragement", label: "Encouragement" },
  { value: "update", label: "Update" },
  { value: "newsletter", label: "Newsletter" },
  { value: "blog", label: "Blog" },
  { value: "behind_the_scenes", label: "Behind the scenes" },
  { value: "resource", label: "Resource" },
  { value: "event", label: "Event" },
];

export const DEFAULT_COMMUNITY_POST_TYPE: CommunityPostType = "update";

/** Quick-picker types in the in-app Mission Hub composer (not the full admin list). */
export const COMPOSER_QUICK_POST_TYPES: { value: CommunityPostType; label: string }[] = [
  { value: "update", label: "Update" },
  { value: "prayer", label: "Prayer" },
  { value: "praise", label: "Praise" },
  { value: "newsletter", label: "Newsletter" },
  { value: "resource", label: "Resource" },
  { value: "event", label: "Event" },
];

const FEED_EXCERPT_MAX = 280;

/** Auto excerpt for feed preview when the owner leaves excerpt blank. */
export function autoExcerptFromBody(body: string): string | undefined {
  const trimmed = body.trim().replace(/\s+/g, " ");
  if (!trimmed) return undefined;
  if (trimmed.length <= FEED_EXCERPT_MAX) return trimmed;
  return `${trimmed.slice(0, FEED_EXCERPT_MAX - 1).trim()}…`;
}

export function nowDatetimeLocalValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/** Public author label for ADMIN/STAFF posts (avatar comes from author_user_id → User.image) */
export const COMMUNITY_POST_AUTHOR_NAME = "Jeremy & Lindsay";

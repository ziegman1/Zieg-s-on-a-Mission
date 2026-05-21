import type { CommunitySpace } from "@/lib/community/types";
import type { CommunitySpaceDetail, CommunitySpaceType } from "@/lib/community/space-experience";
import { isPrayerSpace } from "@/lib/community/space-interaction";

/** Space types that use contemplative room presentation (hero, intro card, soft feed). */
export const SPIRITUAL_SPACE_TYPES = new Set<CommunitySpaceType>([
  "prayer_room",
  "praise_room",
  "testimony",
]);

/** Nav/filter pills that duplicate in-room welcome experiences. */
export const FEED_PILL_EXCLUDED_SLUGS = new Set(["welcome"]);

const HERO_TITLES: Record<string, string> = {
  "prayer-room": "Prayer & Praise Room",
  "prayer-praise-room": "Prayer & Praise Room",
  "prayer-and-praise-room": "Prayer & Praise Room",
};

const HERO_SUBTITLES: Record<string, string> = {
  "prayer-room": "Together in prayer. United in praise. Sent on mission.",
  "prayer-praise-room": "Together in prayer. United in praise. Sent on mission.",
  "prayer-and-praise-room": "Together in prayer. United in praise. Sent on mission.",
};

export const DEFAULT_SPIRITUAL_HERO_IMAGE = "/images/hero-zieg-mission.png";

const SPIRITUAL_SPACE_SLUGS = new Set([
  "prayer-room",
  "prayer-praise-room",
  "prayer-and-praise-room",
]);

export function isSpiritualRoom(
  spaceType: CommunitySpaceType | string,
  slug?: string,
): boolean {
  if (SPIRITUAL_SPACE_TYPES.has(spaceType as CommunitySpaceType)) return true;
  if (isPrayerSpace(spaceType)) return true;
  if (slug && SPIRITUAL_SPACE_SLUGS.has(slug.toLowerCase())) return true;
  return false;
}

function isWelcomeSpace(space: CommunitySpace): boolean {
  const slug = space.slug.toLowerCase();
  if (FEED_PILL_EXCLUDED_SLUGS.has(slug)) return true;
  if (slug.includes("welcome")) return true;
  if (space.title.trim().toLowerCase() === "welcome") return true;
  return false;
}

export function filterSpacesForFeedPills(spaces: CommunitySpace[]): CommunitySpace[] {
  return spaces.filter((s) => !isWelcomeSpace(s));
}

export function getSpiritualHeroTitle(space: CommunitySpaceDetail): string {
  return HERO_TITLES[space.slug.toLowerCase()] ?? space.title;
}

export function getSpiritualHeroSubtitle(space: CommunitySpaceDetail): string | null {
  const bySlug = HERO_SUBTITLES[space.slug.toLowerCase()];
  if (bySlug) return bySlug;
  if (space.description.trim()) return space.description.trim();
  if (space.experience.spaceType === "prayer_room") {
    return "Together in prayer. United in praise. Sent on mission.";
  }
  if (space.experience.spaceType === "praise_room") {
    return "Celebrate what God is doing among us.";
  }
  return null;
}

export function getSpiritualHeroImageUrl(space: CommunitySpaceDetail): string {
  return space.experience.coverImageUrl ?? DEFAULT_SPIRITUAL_HERO_IMAGE;
}

/**
 * Whether to render title/subtitle/icon overlays on the spiritual cover banner.
 * Image-only mode when the cover asset already includes typography.
 */
export function shouldRenderSpiritualCoverOverlay(space: CommunitySpaceDetail): boolean {
  const { settings, coverImageUrl } = space.experience;

  if (settings.hasEmbeddedCoverText === true) return false;
  if (settings.renderCoverOverlay === false) return false;
  if (settings.renderCoverOverlay === true) return true;

  // Custom cover upload → treat as designed asset with embedded copy (Prayer & Praise, etc.)
  if (coverImageUrl?.trim()) return false;

  // Stock fallback hero only — show programmatic title/subtitle
  return true;
}

/** Split welcome copy into paragraphs for intro / expand UI. */
export function parseWelcomeParagraphs(message: string): string[] {
  return message
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** First block is often the title line in DB copy — treat as heading if short. */
export function splitWelcomeHeadingAndBody(paragraphs: string[]): {
  heading: string | null;
  body: string[];
} {
  if (paragraphs.length === 0) return { heading: null, body: [] };
  const first = paragraphs[0]!;
  const looksLikeTitle =
    first.length < 120 &&
    !first.endsWith(".") &&
    paragraphs.length > 1;
  if (looksLikeTitle) {
    return { heading: first, body: paragraphs.slice(1) };
  }
  return { heading: null, body: paragraphs };
}

/** Visible intro: up to 3 paragraphs or ~520 characters. */
export function getWelcomeIntroPreview(body: string[]): {
  preview: string[];
  hasMore: boolean;
} {
  if (body.length <= 3) {
    const total = body.join("\n\n").length;
    if (total <= 520) return { preview: body, hasMore: false };
  }
  let chars = 0;
  const preview: string[] = [];
  for (const p of body) {
    if (preview.length >= 3) return { preview, hasMore: true };
    if (chars + p.length > 520 && preview.length > 0) {
      return { preview, hasMore: true };
    }
    preview.push(p);
    chars += p.length;
  }
  return { preview, hasMore: body.length > preview.length };
}

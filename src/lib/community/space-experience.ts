import type { CommunitySpaceRecord } from "@prisma/client";
import type { CommunitySpaceIcon } from "@/lib/community/types";
import { DEFAULT_COMMUNITY_ICON } from "@/lib/community/constants";
import { mergeSpaceSettings, type CommunitySpaceSettings } from "@/lib/community/settings-types";
import { resolveInteractionSpaceType } from "@/lib/community/space-interaction";

export const COMMUNITY_SPACE_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "prayer", label: "Prayer" },
  { value: "prayer_room", label: "Prayer room" },
  { value: "family", label: "Family" },
  { value: "updates", label: "Updates" },
  { value: "praise_room", label: "Praise room" },
  { value: "discussion", label: "Discussion" },
  { value: "resource_library", label: "Resource library" },
  { value: "newsletter", label: "Newsletter" },
  { value: "testimony", label: "Testimony" },
  { value: "training", label: "Training" },
  { value: "announcements", label: "Announcements" },
] as const;

export type CommunitySpaceType = (typeof COMMUNITY_SPACE_TYPES)[number]["value"];

export const COMMUNITY_THEME_MOODS = [
  { value: "warm", label: "Warm" },
  { value: "reflective", label: "Reflective" },
  { value: "celebratory", label: "Celebratory" },
  { value: "informational", label: "Informational" },
  { value: "prayerful", label: "Prayerful" },
  { value: "missional", label: "Missional" },
] as const;

export type CommunityThemeMood = (typeof COMMUNITY_THEME_MOODS)[number]["value"];

const SPACE_TYPE_VALUES = new Set<string>(COMMUNITY_SPACE_TYPES.map((t) => t.value));
const THEME_MOOD_VALUES = new Set<string>(COMMUNITY_THEME_MOODS.map((t) => t.value));

const ICON_VALUES = new Set<string>([
  "prayer",
  "praise",
  "updates",
  "behind_scenes",
  "newsletter",
  "blog",
  "resources",
  "events",
]);

export type CommunitySpaceExperience = {
  spaceType: CommunitySpaceType;
  themeMood: CommunityThemeMood | null;
  welcomeMessage: string | null;
  engagementPrompt: string | null;
  coverImageUrl: string | null;
  showWelcomeMessage: boolean;
  pinWelcomeMessage: boolean;
  allowComments: boolean;
  allowReactions: boolean;
  allowMemberPosts: boolean;
  requirePostApproval: boolean;
  allowVoiceMessages: boolean;
  /** Legacy JSON: feed sort, pin featured posts */
  settings: CommunitySpaceSettings;
};

export type CommunitySpaceDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: CommunitySpaceIcon;
  status: string;
  postCount: number;
  sortOrder: number;
  featured: boolean;
  experience: CommunitySpaceExperience;
};

export function parseSpaceType(
  value: string | null | undefined,
  slug?: string | null,
): CommunitySpaceType {
  const resolved = resolveInteractionSpaceType(value, slug);
  if (SPACE_TYPE_VALUES.has(resolved)) return resolved as CommunitySpaceType;
  return "standard";
}

export function parseThemeMood(value: string | null | undefined): CommunityThemeMood | null {
  if (value && THEME_MOOD_VALUES.has(value)) return value as CommunityThemeMood;
  return null;
}

export function parseSpaceIcon(icon: string | null | undefined): CommunitySpaceIcon {
  if (icon && ICON_VALUES.has(icon)) return icon as CommunitySpaceIcon;
  return DEFAULT_COMMUNITY_ICON;
}

export function experienceFromSpaceRecord(
  row: Pick<
    CommunitySpaceRecord,
    | "slug"
    | "spaceType"
    | "themeMood"
    | "welcomeMessage"
    | "engagementPrompt"
    | "coverImageUrl"
    | "showWelcomeMessage"
    | "pinWelcomeMessage"
    | "allowComments"
    | "allowReactions"
    | "allowMemberPosts"
    | "requirePostApproval"
    | "allowVoiceMessages"
    | "settings"
  >,
): CommunitySpaceExperience {
  return {
    spaceType: parseSpaceType(row.spaceType, row.slug),
    themeMood: parseThemeMood(row.themeMood),
    welcomeMessage: row.welcomeMessage?.trim() || null,
    engagementPrompt: row.engagementPrompt?.trim() || null,
    coverImageUrl: row.coverImageUrl?.trim() || null,
    showWelcomeMessage: row.showWelcomeMessage,
    pinWelcomeMessage: row.pinWelcomeMessage,
    allowComments: row.allowComments,
    allowReactions: row.allowReactions,
    allowMemberPosts: row.allowMemberPosts,
    requirePostApproval: row.requirePostApproval,
    allowVoiceMessages: row.allowVoiceMessages,
    settings: mergeSpaceSettings(row.settings),
  };
}

/** Prisma select fragment for feed interaction + prompts */
export const spaceExperienceSelect = {
  spaceType: true,
  allowComments: true,
  allowReactions: true,
  engagementPrompt: true,
  allowMemberPosts: true,
  allowVoiceMessages: true,
} as const;

export type SpaceFeedInteraction = {
  spaceType: string;
  allowComments: boolean;
  allowReactions: boolean;
  allowVoiceMessages: boolean;
  engagementPrompt: string | null;
};

export function interactionFromSpaceRow(
  row: Pick<
    CommunitySpaceRecord,
    | "slug"
    | "spaceType"
    | "allowComments"
    | "allowReactions"
    | "engagementPrompt"
    | "allowMemberPosts"
    | "allowVoiceMessages"
  >,
): SpaceFeedInteraction {
  return {
    spaceType: resolveInteractionSpaceType(row.spaceType, row.slug),
    allowComments: row.allowComments,
    allowReactions: row.allowReactions,
    allowVoiceMessages: row.allowVoiceMessages,
    engagementPrompt: row.engagementPrompt?.trim() || null,
  };
}

export function themeMoodSurfaceClass(mood: CommunityThemeMood | null): string {
  switch (mood) {
    case "prayerful":
      return "from-brand-primary/[0.12] via-white/90 to-[#f5f2ef]";
    case "celebratory":
      return "from-brand-accent/15 via-white/92 to-[#f8f6f3]";
    case "reflective":
      return "from-brand-ink/[0.06] via-white/88 to-[#ebe8e4]";
    case "missional":
      return "from-brand-deep-red/[0.08] via-white/90 to-[#f0eeeb]";
    case "informational":
      return "from-brand-primary/[0.08] via-white to-[#f7f5f2]";
    case "warm":
      return "from-brand-accent/10 via-[#faf8f6] to-white/95";
    default:
      return "from-brand-primary/[0.08] via-[#faf9f7] to-white/95";
  }
}

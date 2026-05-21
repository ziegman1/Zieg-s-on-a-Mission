import type { LucideIcon } from "lucide-react";
import {
  HandHeart,
  Heart,
  PartyPopper,
  Sparkles,
  ThumbsUp,
  Users,
} from "lucide-react";
import type { CommunityReactionType } from "@/lib/community/types";
import type { CommunitySpaceType } from "@/lib/community/space-experience";
import { COMMUNITY_REACTION_TYPES } from "@/lib/community/types";

/** Canonical space types for Mission Hub presets (stored in `community_spaces.space_type`). */
export const SPACE_TYPE_PRESETS = [
  "standard",
  "prayer",
  "prayer_room",
  "praise_room",
  "discussion",
  "resource_library",
  "newsletter",
  "testimony",
  "training",
  "announcements",
  "updates",
  "family",
] as const;

export type SpaceInteractionMode = "default" | "prayer";

export type PrayerReactionConfig = {
  type: CommunityReactionType;
  label: string;
  Icon: LucideIcon;
};

export type SpaceInteractionPreset = {
  mode: SpaceInteractionMode;
  /** Primary owner compose CTA on filtered prayer room */
  composePrimaryLabel: string;
  /** Feed toolbar / FAB when viewing prayer room */
  composeShortLabel: string;
  reactions: PrayerReactionConfig[];
  comments: {
    sectionLabel: string;
    toggleLabel: string;
    toggleLabelOpen: string;
    countSingular: string;
    countPlural: string;
    composerWrittenLabel: string;
    composerVoiceLabel: string;
    submitWritten: string;
    submitVoice: string;
    placeholder: string;
    emptyTitle: string;
    emptyBody: string;
    emptyCta: string;
    loadingLabel: string;
    pausedLabel: string;
    actionVerb: string;
    replyVerb: string;
    voiceSharedTemplate: string;
  };
};

const DEFAULT_REACTIONS: PrayerReactionConfig[] = [
  { type: "like", label: "Like", Icon: ThumbsUp },
  { type: "love", label: "Love", Icon: Heart },
  { type: "prayed", label: "Prayed", Icon: HandHeart },
  { type: "celebrating", label: "Celebrate", Icon: PartyPopper },
  { type: "encouraged", label: "Encourage", Icon: Sparkles },
];

/** Prayer spaces — UI labels map to existing reaction types in the DB. */
const PRAYER_REACTIONS: PrayerReactionConfig[] = [
  { type: "prayed", label: "Amen", Icon: HandHeart },
  { type: "love", label: "Praying", Icon: Heart },
  { type: "celebrating", label: "Rejoicing", Icon: PartyPopper },
  { type: "like", label: "Standing With You", Icon: Users },
  { type: "encouraged", label: "Encouraged", Icon: Sparkles },
];

const PRAYER_PRESET: SpaceInteractionPreset = {
  mode: "prayer",
  composePrimaryLabel: "Post Your Prayer",
  composeShortLabel: "Post Your Prayer",
  reactions: PRAYER_REACTIONS,
  comments: {
    sectionLabel: "Prayers shared",
    toggleLabel: "Prayers",
    toggleLabelOpen: "Hide prayers",
    countSingular: "prayer shared",
    countPlural: "prayers shared",
    composerWrittenLabel: "Written Prayer",
    composerVoiceLabel: "Voice Prayer",
    submitWritten: "Share your prayer",
    submitVoice: "Share Voice Prayer",
    placeholder: "How is God leading you to pray for this request?",
    emptyTitle: "No prayers have been shared yet.",
    emptyBody: "Be the first to stand with this request in prayer.",
    emptyCta: "Share a Prayer",
    loadingLabel: "Loading prayers…",
    pausedLabel: "Prayer responses are paused in this room for now.",
    actionVerb: "prayed",
    replyVerb: "Prayer",
    voiceSharedTemplate: "shared a voice prayer",
  },
};

const DEFAULT_PRESET: SpaceInteractionPreset = {
  mode: "default",
  composePrimaryLabel: "New post",
  composeShortLabel: "New post",
  reactions: DEFAULT_REACTIONS,
  comments: {
    sectionLabel: "Comments",
    toggleLabel: "Comment",
    toggleLabelOpen: "Hide",
    countSingular: "comment",
    countPlural: "comments",
    composerWrittenLabel: "Comment",
    composerVoiceLabel: "Voice",
    submitWritten: "Post",
    submitVoice: "Post",
    placeholder: "Share encouragement, prayer, or a note…",
    emptyTitle: "No comments yet.",
    emptyBody: "Be the first to encourage our family.",
    emptyCta: "Add a comment",
    loadingLabel: "Loading comments…",
    pausedLabel: "Comments are paused in this space for now.",
    actionVerb: "commented",
    replyVerb: "Reply",
    voiceSharedTemplate: "shared a voice message",
  },
};

/** Slugs that should always use prayer interaction UI even if DB space_type is stale. */
export const PRAYER_SPACE_SLUGS = new Set([
  "prayer-room",
  "prayer-praise-room",
  "prayer-and-praise-room",
]);

export function devLogMissionHubSpacePreset(payload: {
  slug?: string | null;
  spaceType?: string | null;
  resolvedType: string;
  presetName: SpaceInteractionMode;
  source?: string;
}): void {
  if (process.env.NODE_ENV !== "development") return;
  console.log("[MissionHub space preset]", payload);
}

/** Trim + lowercase; map common labels/variants to snake_case tokens. */
export function normalizeSpaceTypeRaw(value: string | null | undefined): string {
  const t = (value ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  if (!t) return "standard";
  if (t === "prayer" || t === "prayer_room" || t === "prayer-room") {
    return t === "prayer" ? "prayer" : "prayer_room";
  }
  if (t === "praise_room" || t === "praise-room") return "praise_room";
  return t;
}

export function isPrayerSpaceSlug(slug: string | null | undefined): boolean {
  if (!slug) return false;
  const s = slug.trim().toLowerCase();
  if (PRAYER_SPACE_SLUGS.has(s)) return true;
  return s.includes("prayer") && (s.includes("praise") || s.includes("room"));
}

export function isPrayerSpace(spaceType: string | null | undefined): boolean {
  const t = normalizeSpaceTypeRaw(spaceType);
  return t === "prayer" || t === "prayer_room";
}

/**
 * Resolve effective space type for UI presets (DB value + slug fallback).
 * Fixes rooms where spiritual layout works via slug but space_type is still `standard`.
 */
export function resolveInteractionSpaceType(
  spaceType: string | null | undefined,
  slug?: string | null,
): string {
  const normalized = normalizeSpaceTypeRaw(spaceType);
  if (isPrayerSpace(normalized)) {
    return normalized === "prayer" ? "prayer" : "prayer_room";
  }
  if (isPrayerSpaceSlug(slug)) {
    return "prayer_room";
  }
  if (SPACE_TYPE_PRESETS.includes(normalized as (typeof SPACE_TYPE_PRESETS)[number])) {
    return normalized;
  }
  return "standard";
}

export function getSpaceInteractionPreset(
  spaceType: string | null | undefined,
  slug?: string | null,
): SpaceInteractionPreset {
  const resolved = resolveInteractionSpaceType(spaceType, slug);
  const preset = isPrayerSpace(resolved) ? PRAYER_PRESET : DEFAULT_PRESET;
  devLogMissionHubSpacePreset({
    slug,
    spaceType,
    resolvedType: resolved,
    presetName: preset.mode,
  });
  return preset;
}

export function reactionTypesForPreset(preset: SpaceInteractionPreset): CommunityReactionType[] {
  return preset.reactions.map((r) => r.type);
}

/** Default feed uses all types; prayer preset uses mapped subset only. */
export function allReactionTypesForMode(mode: SpaceInteractionMode): CommunityReactionType[] {
  if (mode === "prayer") {
    return PRAYER_REACTIONS.map((r) => r.type);
  }
  return [...COMMUNITY_REACTION_TYPES];
}

export function prayerParticipationHints(): { label: string; postType: "prayer" | "praise" | "update" }[] {
  return [
    { label: "Pray With Us", postType: "prayer" },
    { label: "Leave Encouragement", postType: "prayer" },
    { label: "Share Testimony", postType: "praise" },
    { label: "Send Voice Prayer", postType: "prayer" },
  ];
}

/** Normalize legacy DB values for admin display */
export function normalizeSpaceTypeLabel(spaceType: CommunitySpaceType | string): string {
  if (isPrayerSpace(spaceType)) return "Prayer";
  return spaceType.replace(/_/g, " ");
}

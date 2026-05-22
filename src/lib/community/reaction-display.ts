import type { CommunityReactionType } from "@/lib/community/types";

export const DEFAULT_STANDARD_REACTION: CommunityReactionType = "like";

/** Long-press tray (tap applies Like). */
export const STANDARD_REACTION_TRAY_TYPES = [
  "love",
  "prayed",
  "celebrating",
  "encouraged",
] as const satisfies readonly CommunityReactionType[];

export const STANDARD_REACTION_ORDER: CommunityReactionType[] = [
  "like",
  "love",
  "prayed",
  "celebrating",
  "encouraged",
];

export const REACTION_EMOJI: Record<CommunityReactionType, string> = {
  like: "👍",
  love: "❤️",
  prayed: "🙏",
  celebrating: "🎉",
  encouraged: "✨",
};

export const REACTION_LABEL: Record<CommunityReactionType, string> = {
  like: "Like",
  love: "Love",
  prayed: "Prayed",
  celebrating: "Celebrate",
  encouraged: "Encouraged",
};

export const REACTION_HOLD_TIP_KEY = "reaction_hold_tip_seen";

export function totalReactionCount(counts: Partial<Record<CommunityReactionType, number>>): number {
  return STANDARD_REACTION_ORDER.reduce((sum, t) => sum + (counts[t] ?? 0), 0);
}

export function activeReactionTypes(
  counts: Partial<Record<CommunityReactionType, number>>,
): CommunityReactionType[] {
  return STANDARD_REACTION_ORDER.filter((t) => (counts[t] ?? 0) > 0);
}

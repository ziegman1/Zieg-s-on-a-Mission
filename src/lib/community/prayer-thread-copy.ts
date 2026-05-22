import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";

export function prayerThreadButtonLabel(
  count: number,
  copy: SpaceInteractionPreset["comments"],
): string {
  if (count === 0) return copy.threadInvite;
  if (count === 1) return copy.threadViewOne;
  return copy.threadViewMany.replace("{count}", String(count));
}

/** Compact pill on post cards: "Prayers · 3" */
export function prayerThreadPillLabel(count: number): string {
  if (count <= 0) return "Prayers";
  return `Prayers · ${count}`;
}

export function prayerThreadSummaryLabel(
  count: number,
  copy: SpaceInteractionPreset["comments"],
): string {
  if (count === 0) return copy.threadEmptyHint;
  if (count === 1) return `1 ${copy.countSingular}`;
  return `${count} ${copy.countPlural}`;
}

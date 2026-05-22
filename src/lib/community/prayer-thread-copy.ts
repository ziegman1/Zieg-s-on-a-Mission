import type { SpaceInteractionPreset } from "@/lib/community/space-interaction";

export function prayerThreadButtonLabel(
  count: number,
  copy: SpaceInteractionPreset["comments"],
): string {
  if (count === 0) return copy.threadInvite;
  if (count === 1) return copy.threadViewOne;
  return copy.threadViewMany.replace("{count}", String(count));
}

export function prayerThreadSummaryLabel(
  count: number,
  copy: SpaceInteractionPreset["comments"],
): string {
  if (count === 0) return copy.threadEmptyHint;
  if (count === 1) return `1 ${copy.countSingular}`;
  return `${count} ${copy.countPlural}`;
}

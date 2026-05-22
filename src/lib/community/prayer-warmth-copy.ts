/** Calm microcopy for prayer participation — not social reactions. */

export function prayerParticipationWarmthLabel(
  prayingCount: number,
  prayerResponseCount: number,
): string | null {
  const parts: string[] = [];

  if (prayingCount > 0) {
    parts.push(
      prayingCount === 1 ? "1 person praying" : `${prayingCount} people praying`,
    );
  }

  if (prayerResponseCount > 0 && prayingCount === 0) {
    if (prayerResponseCount >= 2) {
      parts.push("Recently prayed");
    }
  } else if (prayerResponseCount > 0 && parts.length > 0) {
    parts.push(
      prayerResponseCount === 1
        ? "1 prayer in the thread"
        : `${prayerResponseCount} prayers in the thread`,
    );
  }

  if (parts.length === 0) return null;
  return parts.slice(0, 2).join(" · ");
}

/** Decorative initials for avatar stack when we lack per-user data. */
export function prayerAvatarStackLabels(count: number): string[] {
  const pool = ["JM", "SK", "AL", "TR", "RB", "KC"];
  const n = Math.min(Math.max(count, 0), 3);
  return pool.slice(0, n);
}

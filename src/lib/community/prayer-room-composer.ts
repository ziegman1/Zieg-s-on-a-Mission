export type PrayerRoomComposerKind =
  | "prayer_request"
  | "praise_report"
  | "encouragement"
  | "voice_prayer";

export type PrayerRoomComposerPreset = {
  kind: PrayerRoomComposerKind;
  postType: "prayer" | "praise" | "encouragement";
  ctaLabel: string;
  sheetTitle: string;
  sheetDescription: string;
  titlePlaceholder: string;
  bodyPlaceholder: string;
  submitLabel: string;
  successMessage: string;
  initialMode: "written" | "voice";
};

export const PRAYER_ROOM_COMPOSER_PRESETS: Record<
  PrayerRoomComposerKind,
  PrayerRoomComposerPreset
> = {
  prayer_request: {
    kind: "prayer_request",
    postType: "prayer",
    ctaLabel: "Share a Prayer Request",
    sheetTitle: "Share a Prayer Request",
    sheetDescription: "Your request helps our family pray with purpose.",
    titlePlaceholder: "What can we pray for?",
    bodyPlaceholder: "Share your prayer request with the community…",
    submitLabel: "Share Prayer Request",
    successMessage: "Your prayer request was shared.",
    initialMode: "written",
  },
  praise_report: {
    kind: "praise_report",
    postType: "praise",
    ctaLabel: "Share a Praise Report / Testimony",
    sheetTitle: "Share a Praise Report",
    sheetDescription: "Celebrate what God has done with the community.",
    titlePlaceholder: "What are you praising God for?",
    bodyPlaceholder: "Share what God has done…",
    submitLabel: "Share Praise Report",
    successMessage: "Your praise report was shared.",
    initialMode: "written",
  },
  encouragement: {
    kind: "encouragement",
    postType: "encouragement",
    ctaLabel: "Leave Encouragement",
    sheetTitle: "Leave Encouragement",
    sheetDescription: "Offer Scripture, prayer, or a word of hope.",
    titlePlaceholder: "Encouragement for the community",
    bodyPlaceholder:
      "Share a Scripture, prayer, or word of encouragement…",
    submitLabel: "Share Encouragement",
    successMessage: "Your encouragement was shared.",
    initialMode: "written",
  },
  voice_prayer: {
    kind: "voice_prayer",
    postType: "prayer",
    ctaLabel: "Send Voice Prayer",
    sheetTitle: "Send Voice Prayer",
    sheetDescription: "Record or upload a short voice prayer for the room.",
    titlePlaceholder: "What can we pray for?",
    bodyPlaceholder: "Optional note with your voice prayer…",
    submitLabel: "Share Voice Prayer",
    successMessage: "Your voice prayer was shared.",
    initialMode: "voice",
  },
};

const KINDS = Object.keys(PRAYER_ROOM_COMPOSER_PRESETS) as PrayerRoomComposerKind[];

export function parsePrayerRoomComposerKind(
  raw: string | null | undefined,
): PrayerRoomComposerKind | null {
  if (!raw?.trim()) return null;
  const key = raw.trim() as PrayerRoomComposerKind;
  return KINDS.includes(key) ? key : null;
}

export function getPrayerRoomComposerPreset(
  kind: PrayerRoomComposerKind,
): PrayerRoomComposerPreset {
  return PRAYER_ROOM_COMPOSER_PRESETS[kind];
}

/** Return path with compose intent for post-login resume. */
export function buildPrayerRoomComposeCallbackUrl(
  spaceSlug: string,
  kind: PrayerRoomComposerKind,
): string {
  const base = `/community/${spaceSlug}`;
  return `${base}?compose=${kind}`;
}

export type PrayerRoomActivitySummary = {
  prayerCount: number;
  praiseCount: number;
  encouragementCount: number;
  otherCount: number;
  total: number;
};

export function summarizePrayerRoomActivity(
  posts: { postType: string }[],
): PrayerRoomActivitySummary {
  let prayerCount = 0;
  let praiseCount = 0;
  let encouragementCount = 0;
  let otherCount = 0;

  for (const post of posts) {
    if (post.postType === "prayer") prayerCount += 1;
    else if (post.postType === "praise") praiseCount += 1;
    else if (post.postType === "encouragement") encouragementCount += 1;
    else otherCount += 1;
  }

  return {
    prayerCount,
    praiseCount,
    encouragementCount,
    otherCount,
    total: posts.length,
  };
}

export function formatPrayerRoomActivityLabel(summary: PrayerRoomActivitySummary): string {
  if (summary.total === 0) return "";

  const parts: string[] = [];
  if (summary.prayerCount > 0) {
    parts.push(
      `${summary.prayerCount} prayer${summary.prayerCount === 1 ? "" : "s"} shared`,
    );
  }
  if (summary.praiseCount > 0) {
    parts.push(
      `${summary.praiseCount} praise report${summary.praiseCount === 1 ? "" : "s"} shared`,
    );
  }
  if (summary.encouragementCount > 0) {
    parts.push(
      `${summary.encouragementCount} encouragement${summary.encouragementCount === 1 ? "" : "s"} shared`,
    );
  }
  if (parts.length > 0) return parts.join(" · ");

  const n = summary.total;
  return `${n} room update${n === 1 ? "" : "s"}`;
}

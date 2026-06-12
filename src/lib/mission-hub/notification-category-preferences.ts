import type { SpaceNotificationCategory } from "@/lib/community/space-notification-category-values";
import type { NotificationPreferences } from "@/lib/community/settings-types";

export const NOTIFICATION_FREQUENCIES = [
  "immediate",
  "daily_digest",
  "weekly_digest",
  "never",
] as const;

export type NotificationFrequency = (typeof NOTIFICATION_FREQUENCIES)[number];

export const MISSION_HUB_EMAIL_CATEGORIES = [
  "ministryUpdates",
  "prayerRequests",
  "praiseReports",
  "newsletters",
  "communityActivity",
] as const;

export type MissionHubEmailCategory = (typeof MISSION_HUB_EMAIL_CATEGORIES)[number];

export const DEFAULT_CATEGORY_FREQUENCIES: Record<
  MissionHubEmailCategory,
  NotificationFrequency
> = {
  ministryUpdates: "immediate",
  prayerRequests: "immediate",
  praiseReports: "immediate",
  newsletters: "immediate",
  communityActivity: "immediate",
};

export const NOTIFICATION_FREQUENCY_LABELS: Record<
  NotificationFrequency,
  { label: string; description: string }
> = {
  immediate: {
    label: "Immediate",
    description: "Send an email as soon as something is published.",
  },
  daily_digest: {
    label: "Daily digest",
    description: "Roll up into a once-daily summary email.",
  },
  weekly_digest: {
    label: "Weekly digest",
    description: "Include in the Saturday weekly Mission Hub summary.",
  },
  never: {
    label: "Never",
    description: "Do not email for this category.",
  },
};

export const MISSION_HUB_EMAIL_CATEGORY_LABELS: Record<
  MissionHubEmailCategory,
  { label: string; description: string }
> = {
  ministryUpdates: {
    label: "Ministry Updates",
    description: "Important announcements and ministry-wide updates.",
  },
  prayerRequests: {
    label: "Prayer Requests",
    description: "Prayer needs and urgent prayer alerts.",
  },
  praiseReports: {
    label: "Praise Reports",
    description: "Celebrations and praise shared in the community.",
  },
  newsletters: {
    label: "Newsletters",
    description: "When a new newsletter is published.",
  },
  communityActivity: {
    label: "Community Activity",
    description: "New posts, comments, and replies in your spaces.",
  },
};

export function isNotificationFrequency(value: unknown): value is NotificationFrequency {
  return (
    typeof value === "string" &&
    (NOTIFICATION_FREQUENCIES as readonly string[]).includes(value)
  );
}

export function spaceCategoryToEmailCategory(
  category: SpaceNotificationCategory,
): MissionHubEmailCategory {
  switch (category) {
    case "ministry_updates":
      return "ministryUpdates";
    case "newsletters":
      return "newsletters";
    case "prayer_requests":
      return "prayerRequests";
    case "praise_reports":
      return "praiseReports";
    case "blog_articles":
    case "resources":
    case "custom":
    default:
      return "communityActivity";
  }
}

export function categoryFrequency(
  prefs: NotificationPreferences,
  category: MissionHubEmailCategory,
): NotificationFrequency {
  return prefs.categoryFrequencies[category] ?? DEFAULT_CATEGORY_FREQUENCIES[category];
}

export function wantsImmediateEmailForCategory(
  prefs: NotificationPreferences,
  category: MissionHubEmailCategory,
): boolean {
  return prefs.email === true && categoryFrequency(prefs, category) === "immediate";
}

export function wantsDailyDigestForCategory(
  prefs: NotificationPreferences,
  category: MissionHubEmailCategory,
): boolean {
  return prefs.email === true && categoryFrequency(prefs, category) === "daily_digest";
}

export function wantsWeeklyDigestForCategory(
  prefs: NotificationPreferences,
  category: MissionHubEmailCategory,
): boolean {
  return prefs.email === true && categoryFrequency(prefs, category) === "weekly_digest";
}

export function memberWantsAnyDigestEmail(prefs: NotificationPreferences): boolean {
  if (prefs.email !== true) return false;
  return MISSION_HUB_EMAIL_CATEGORIES.some(
    (category) =>
      categoryFrequency(prefs, category) === "daily_digest" ||
      categoryFrequency(prefs, category) === "weekly_digest",
  );
}

export function memberUsesDailyDigest(prefs: NotificationPreferences): boolean {
  if (prefs.email !== true) return false;
  return MISSION_HUB_EMAIL_CATEGORIES.some(
    (category) => categoryFrequency(prefs, category) === "daily_digest",
  );
}

export function memberUsesWeeklyDigestCategories(
  prefs: NotificationPreferences,
): boolean {
  if (prefs.email !== true) return false;
  if (prefs.weeklyDigest !== false) return true;
  return MISSION_HUB_EMAIL_CATEGORIES.some(
    (category) => categoryFrequency(prefs, category) === "weekly_digest",
  );
}

export function mergeCategoryFrequencies(raw: unknown): Record<
  MissionHubEmailCategory,
  NotificationFrequency
> {
  const out = { ...DEFAULT_CATEGORY_FREQUENCIES };
  if (!raw || typeof raw !== "object") return out;
  const o = raw as Record<string, unknown>;
  for (const key of MISSION_HUB_EMAIL_CATEGORIES) {
    const value = o[key];
    if (isNotificationFrequency(value)) out[key] = value;
  }
  return out;
}

function booleanToFrequency(
  enabled: boolean | undefined,
  fallback: NotificationFrequency = "immediate",
): NotificationFrequency {
  if (enabled === false) return "never";
  return fallback;
}

/** Derive category frequencies from legacy boolean prefs when JSON lacks categoryFrequencies. */
export function deriveCategoryFrequenciesFromLegacy(
  o: Record<string, unknown>,
): Record<MissionHubEmailCategory, NotificationFrequency> {
  const weeklyFallback =
    o.weeklyDigest === false ? ("immediate" as const) : ("weekly_digest" as const);

  const communityActivityOn =
    o.commentsOnPosts !== false ||
    o.repliesToComments !== false ||
    o.newPosts !== false;

  return {
    ministryUpdates: booleanToFrequency(o.ministryUpdates as boolean | undefined),
    prayerRequests: booleanToFrequency(o.prayerResponses as boolean | undefined),
    praiseReports: booleanToFrequency(o.praiseReports as boolean | undefined),
    newsletters: booleanToFrequency(
      o.newsletters as boolean | undefined,
      weeklyFallback,
    ),
    communityActivity: communityActivityOn ? "immediate" : "never",
  };
}

/** Keep legacy boolean keys aligned with category frequency selections. */
export function syncLegacyBooleansFromCategoryFrequencies(
  prefs: NotificationPreferences,
): NotificationPreferences {
  const f = prefs.categoryFrequencies;
  const isOn = (category: MissionHubEmailCategory) => f[category] !== "never";

  return {
    ...prefs,
    ministryUpdates: isOn("ministryUpdates"),
    newsletters: isOn("newsletters"),
    praiseReports: isOn("praiseReports"),
    prayerResponses: isOn("prayerRequests"),
    newPosts: isOn("communityActivity"),
    commentsOnPosts: isOn("communityActivity"),
    repliesToComments: isOn("communityActivity"),
    weeklyDigest: MISSION_HUB_EMAIL_CATEGORIES.some(
      (category) => f[category] === "weekly_digest",
    ),
  };
}

export function allMissionHubEmailCategoriesNever(
  prefs: NotificationPreferences,
): boolean {
  return MISSION_HUB_EMAIL_CATEGORIES.every(
    (category) => categoryFrequency(prefs, category) === "never",
  );
}

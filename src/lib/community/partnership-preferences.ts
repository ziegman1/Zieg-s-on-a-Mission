import type { NotificationPreferences } from "@/lib/community/settings-types";

export const PARTNERSHIP_PREF_KEYS = [
  "ministryUpdates",
  "newsletters",
  "prayerTeam",
  "urgentPrayerRequests",
  "advocacyInterest",
  "financialPartnership",
] as const;

export type PartnershipPrefKey = (typeof PARTNERSHIP_PREF_KEYS)[number];

export type PartnershipPreferences = Record<PartnershipPrefKey, boolean> & {
  /** ISO timestamp — null until onboarding is completed or preferences are saved. */
  onboardingCompletedAt: string | null;
  /** One-time welcome post intro after partnership onboarding (default false). */
  welcomeIntroCompleted: boolean;
};

export const PARTNERSHIP_PREF_LABELS: Record<
  PartnershipPrefKey,
  { label: string; description: string }
> = {
  ministryUpdates: {
    label: "Receive Ministry Updates",
    description: "Important announcements and highlights from our ministry family.",
  },
  newsletters: {
    label: "Receive Newsletters",
    description: "Published newsletters and ministry-wide updates in Mission Hub.",
  },
  prayerTeam: {
    label: "Join the Prayer Team",
    description: "Walk with us as an intentional prayer partner for the mission.",
  },
  urgentPrayerRequests: {
    label: "Receive Urgent Prayer Requests",
    description: "Time-sensitive prayer needs separate from general prayer team updates.",
  },
  advocacyInterest: {
    label: "Learn About Advocacy Opportunities",
    description: "Ways to speak up and stand with the mission in your community.",
  },
  financialPartnership: {
    label: "Learn About Financial Partnership",
    description: "Giving and financial partnership opportunities when shared.",
  },
};

/** Default checkbox state when the onboarding form first appears. */
export const DEFAULT_PARTNERSHIP_ONBOARDING_SELECTION: Record<PartnershipPrefKey, boolean> =
  {
    ministryUpdates: true,
    newsletters: false,
    prayerTeam: false,
    urgentPrayerRequests: false,
    advocacyInterest: false,
    financialPartnership: false,
  };

export function createDefaultPartnershipPreferences(
  completed = false,
): PartnershipPreferences {
  return {
    ...DEFAULT_PARTNERSHIP_ONBOARDING_SELECTION,
    onboardingCompletedAt: completed ? new Date().toISOString() : null,
    welcomeIntroCompleted: false,
  };
}

export function mergePartnershipPreferences(raw: unknown): PartnershipPreferences | null {
  if (raw == null) return null;
  if (typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out: PartnershipPreferences = {
    ...DEFAULT_PARTNERSHIP_ONBOARDING_SELECTION,
    onboardingCompletedAt: null,
    welcomeIntroCompleted: false,
  };
  for (const key of PARTNERSHIP_PREF_KEYS) {
    if (typeof o[key] === "boolean") out[key] = o[key];
  }
  if (typeof o.onboardingCompletedAt === "string" && o.onboardingCompletedAt.trim()) {
    out.onboardingCompletedAt = o.onboardingCompletedAt;
  }
  if (typeof o.welcomeIntroCompleted === "boolean") {
    out.welcomeIntroCompleted = o.welcomeIntroCompleted;
  }
  return out;
}

export function needsPartnershipOnboarding(raw: unknown): boolean {
  const prefs = mergePartnershipPreferences(raw);
  return prefs?.onboardingCompletedAt == null;
}

export function partnershipPreferencesFromSelection(
  selection: Record<PartnershipPrefKey, boolean>,
  markComplete: boolean,
  options?: { welcomeIntroCompleted?: boolean },
): PartnershipPreferences {
  return {
    ...selection,
    onboardingCompletedAt: markComplete ? new Date().toISOString() : null,
    welcomeIntroCompleted: options?.welcomeIntroCompleted ?? false,
  };
}

/** Align notification content prefs with partnership choices (channels unchanged). */
export function applyPartnershipToNotificationPreferences(
  partnership: PartnershipPreferences,
  notification: NotificationPreferences,
): NotificationPreferences {
  return {
    ...notification,
    ministryUpdates: partnership.ministryUpdates,
    newsletters: partnership.newsletters,
    prayerResponses:
      partnership.urgentPrayerRequests || partnership.prayerTeam
        ? true
        : notification.prayerResponses,
  };
}

export type PartnershipSegmentFilter =
  | "all"
  | "ministryUpdates"
  | "newsletters"
  | "prayerTeam"
  | "urgentPrayerRequests"
  | "advocacyInterest"
  | "financialPartnership"
  | "onboardingPending";

export const PARTNERSHIP_SEGMENT_FILTER_LABELS: Record<PartnershipSegmentFilter, string> =
  {
    all: "All segments",
    ministryUpdates: "Ministry Updates",
    newsletters: "Newsletter Recipients",
    prayerTeam: "Prayer Team",
    urgentPrayerRequests: "Urgent Prayer Requests",
    advocacyInterest: "Advocacy Interest",
    financialPartnership: "Financial Partnership Interest",
    onboardingPending: "Onboarding not completed",
  };

export function memberMatchesPartnershipSegment(
  row: {
    partnershipCompleted: boolean;
    ministryUpdates: boolean;
    newsletters: boolean;
    prayerTeam: boolean;
    urgentPrayerRequests: boolean;
    advocacyInterest: boolean;
    financialPartnership: boolean;
  },
  segment: PartnershipSegmentFilter,
): boolean {
  if (segment === "all") return true;
  if (segment === "onboardingPending") return !row.partnershipCompleted;
  return row[segment] === true;
}

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/lib/community/settings-types";

export type NewsletterNotificationEligibility = {
  hasMissionHubAccess: boolean;
  wantsNewsletterContent: boolean;
  emailChannel: boolean;
  inAppChannel: boolean;
  pushChannel: boolean;
  spaceMuted: boolean;
};

export type NewsletterNotificationSkipReason =
  | "no_hub_access"
  | "newsletters_disabled"
  | "ministry_updates_disabled"
  | "space_muted"
  | "all_channels_off";

/**
 * Whether a member should receive newsletter publish notifications (per channel).
 * Does not send — used for recipient preparation counts only.
 */
export function evaluateNewsletterNotificationEligibility(
  prefs: NotificationPreferences,
  options: {
    announcementSpaceId?: string | null;
    hasMissionHubAccess?: boolean;
  } = {},
): NewsletterNotificationEligibility & { skipReason: NewsletterNotificationSkipReason | null } {
  const hasMissionHubAccess = options.hasMissionHubAccess !== false;
  const muted = new Set(prefs.mutedSpaceIds ?? []);
  const spaceMuted = Boolean(
    options.announcementSpaceId && muted.has(options.announcementSpaceId),
  );

  const wantsNewsletterContent =
    prefs.newsletters !== false && prefs.ministryUpdates !== false && !spaceMuted;

  const emailChannel = wantsNewsletterContent && prefs.email === true;
  const inAppChannel = wantsNewsletterContent && prefs.inApp === true;
  const pushChannel = wantsNewsletterContent && prefs.push === true;

  let skipReason: NewsletterNotificationSkipReason | null = null;
  if (!hasMissionHubAccess) skipReason = "no_hub_access";
  else if (prefs.newsletters === false) skipReason = "newsletters_disabled";
  else if (prefs.ministryUpdates === false) skipReason = "ministry_updates_disabled";
  else if (spaceMuted) skipReason = "space_muted";
  else if (!emailChannel && !inAppChannel && !pushChannel) skipReason = "all_channels_off";

  return {
    hasMissionHubAccess,
    wantsNewsletterContent,
    emailChannel,
    inAppChannel,
    pushChannel,
    spaceMuted,
    skipReason,
  };
}

/** Member is eligible for weekly digest preparation (delivery not sent). */
export function memberWantsWeeklyDigest(prefs: NotificationPreferences): boolean {
  return prefs.weeklyDigest !== false && prefs.email === true;
}

export function normalizeMutedSpaceIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
}

export function toggleMutedSpace(
  prefs: NotificationPreferences,
  spaceId: string,
  muted: boolean,
): NotificationPreferences {
  const set = new Set(prefs.mutedSpaceIds ?? []);
  if (muted) set.add(spaceId);
  else set.delete(spaceId);
  return { ...prefs, mutedSpaceIds: [...set] };
}

export { DEFAULT_NOTIFICATION_PREFERENCES };

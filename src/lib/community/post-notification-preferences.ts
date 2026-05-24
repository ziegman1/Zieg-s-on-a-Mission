import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/lib/community/settings-types";

export type PostNotificationSkipReason =
  | "new_posts_disabled"
  | "space_muted"
  | "email_channel_disabled"
  | "in_app_channel_disabled"
  | "all_channels_off";

export type PostNotificationEligibility = {
  emailChannel: boolean;
  inAppChannel: boolean;
  spaceMuted: boolean;
  skipReason: PostNotificationSkipReason | null;
};

export function evaluatePostPublishNotificationEligibility(
  prefs: NotificationPreferences,
  options: {
    spaceId: string;
  },
): PostNotificationEligibility {
  const muted = new Set(prefs.mutedSpaceIds ?? []);
  const spaceMuted = muted.has(options.spaceId);
  const wantsNewPosts = prefs.newPosts !== false && !spaceMuted;

  const emailChannel = wantsNewPosts && prefs.email === true;
  const inAppChannel = wantsNewPosts && prefs.inApp === true;

  let skipReason: PostNotificationSkipReason | null = null;
  if (prefs.newPosts === false) skipReason = "new_posts_disabled";
  else if (spaceMuted) skipReason = "space_muted";
  else if (!emailChannel && !inAppChannel) skipReason = "all_channels_off";

  return {
    emailChannel,
    inAppChannel,
    spaceMuted,
    skipReason,
  };
}

export { DEFAULT_NOTIFICATION_PREFERENCES };

import type { NotificationPreferences } from "@/lib/community/settings-types";
import {
  MISSION_HUB_EMAIL_CATEGORIES,
  categoryFrequency,
  memberUsesWeeklyDigestCategories,
} from "@/lib/mission-hub/notification-category-preferences";
import type { NotificationPreferenceEventType } from "@/lib/mission-hub/notification-preference-event-types";

export function weeklyDigestEligible(prefs: NotificationPreferences): boolean {
  return memberUsesWeeklyDigestCategories(prefs);
}

/** Derive audit event types from a preference snapshot change. */
export function diffNotificationPreferenceEvents(
  previous: NotificationPreferences,
  next: NotificationPreferences,
): NotificationPreferenceEventType[] {
  const events: NotificationPreferenceEventType[] = [];

  if (previous.email !== next.email) {
    events.push(next.email ? "email_channel_enabled" : "email_channel_disabled");
  }

  const prevWeekly = weeklyDigestEligible(previous);
  const nextWeekly = weeklyDigestEligible(next);
  if (prevWeekly !== nextWeekly) {
    events.push(nextWeekly ? "weekly_digest_enabled" : "weekly_digest_disabled");
  }

  let categoryChanged = false;
  for (const category of MISSION_HUB_EMAIL_CATEGORIES) {
    if (categoryFrequency(previous, category) !== categoryFrequency(next, category)) {
      categoryChanged = true;
      break;
    }
  }
  if (categoryChanged) {
    events.push("category_frequency_changed");
  }

  return events;
}

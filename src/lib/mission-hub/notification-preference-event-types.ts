import type { NotificationPreferences } from "@/lib/community/settings-types";

export const NOTIFICATION_PREFERENCE_EVENT_TYPES = [
  "email_channel_disabled",
  "email_channel_enabled",
  "weekly_digest_disabled",
  "weekly_digest_enabled",
  "category_frequency_changed",
  "unsubscribe_link_used",
  "suppression_created",
  "suppression_removed",
  "partnership_prefs_synced",
] as const;

export type NotificationPreferenceEventType =
  (typeof NOTIFICATION_PREFERENCE_EVENT_TYPES)[number];

export const NOTIFICATION_PREFERENCE_ACTOR_TYPES = [
  "user",
  "admin",
  "system",
  "webhook",
] as const;

export type NotificationPreferenceActorType =
  (typeof NOTIFICATION_PREFERENCE_ACTOR_TYPES)[number];

export const NOTIFICATION_PREFERENCE_EVENT_LABELS: Record<
  NotificationPreferenceEventType,
  string
> = {
  email_channel_disabled: "Email notifications disabled",
  email_channel_enabled: "Email notifications enabled",
  weekly_digest_disabled: "Weekly digest disabled",
  weekly_digest_enabled: "Weekly digest enabled",
  category_frequency_changed: "Email category frequency changed",
  unsubscribe_link_used: "Unsubscribe link used",
  suppression_created: "Email suppressed",
  suppression_removed: "Email suppression removed",
  partnership_prefs_synced: "Partnership preferences synced",
};

export type RecordPreferenceEventInput = {
  userId: string;
  memberId?: string | null;
  email: string;
  eventType: NotificationPreferenceEventType;
  actorType: NotificationPreferenceActorType;
  actorUserId?: string | null;
  previousPrefs?: NotificationPreferences | null;
  nextPrefs?: NotificationPreferences | null;
  metadata?: Record<string, unknown>;
};

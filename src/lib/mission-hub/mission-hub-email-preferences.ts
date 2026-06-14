import "server-only";

import {
  DEFAULT_CATEGORY_FREQUENCIES,
  allMissionHubEmailCategoriesNever,
  syncLegacyBooleansFromCategoryFrequencies,
  type MissionHubEmailCategory,
  type NotificationFrequency,
} from "@/lib/mission-hub/notification-category-preferences";
import {
  mergeNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/community/settings-types";
import { updateUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import {
  removeEmailSuppression,
  upsertEmailSuppression,
} from "@/lib/mission-hub/email-suppressions";
import type { NotificationPreferenceActorType } from "@/lib/mission-hub/notification-preference-event-types";
import {
  recordPreferenceDiffEvents,
  recordUnsubscribeLinkUsedEvent,
} from "@/lib/mission-hub/notification-preference-events";

const ALL_NEVER: Record<MissionHubEmailCategory, NotificationFrequency> = {
  ministryUpdates: "never",
  prayerRequests: "never",
  praiseReports: "never",
  newsletters: "never",
  communityActivity: "never",
};

export async function syncMissionHubEmailSuppression(input: {
  userId: string;
  email: string;
  prefs: NotificationPreferences;
  actorType?: NotificationPreferenceActorType;
  actorUserId?: string | null;
}): Promise<void> {
  const actorType = input.actorType ?? "system";
  const actorUserId = input.actorUserId ?? input.userId;

  if (
    input.prefs.email === false ||
    allMissionHubEmailCategoriesNever(input.prefs)
  ) {
    await upsertEmailSuppression({
      email: input.email,
      scope: "mission_hub",
      reason: "unsubscribe",
      userId: input.userId,
      metadata: { source: "mission_hub_preferences" },
      audit: { actorType, actorUserId },
    });
    return;
  }

  await removeEmailSuppression({
    email: input.email,
    scope: "mission_hub",
    audit: { actorType, actorUserId, userId: input.userId },
  });
}

/** Mission Hub-only unsubscribe — does not touch Mail Suite. */
export async function unsubscribeMissionHubEmail(input: {
  userId: string;
  email: string;
}): Promise<NotificationPreferences> {
  const current = mergeNotificationPreferences(await getRawPrefs(input.userId));

  const next = syncLegacyBooleansFromCategoryFrequencies({
    ...current,
    email: false,
    categoryFrequencies: { ...ALL_NEVER },
  });

  await updateUserNotificationPreferences(input.userId, next);
  await upsertEmailSuppression({
    email: input.email,
    scope: "mission_hub",
    reason: "unsubscribe",
    userId: input.userId,
    metadata: { source: "mission_hub_unsubscribe" },
    audit: { actorType: "user", actorUserId: input.userId },
  });

  await recordUnsubscribeLinkUsedEvent({
    userId: input.userId,
    email: input.email,
    previous: current,
    next,
  });

  return next;
}

export async function saveMissionHubNotificationPreferences(input: {
  userId: string;
  email: string;
  prefs: NotificationPreferences;
  actorType?: NotificationPreferenceActorType;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<NotificationPreferences> {
  const previous = mergeNotificationPreferences(await getRawPrefs(input.userId));
  const actorType = input.actorType ?? "user";
  const actorUserId = input.actorUserId ?? input.userId;

  const next = syncLegacyBooleansFromCategoryFrequencies({
    ...input.prefs,
    categoryFrequencies: {
      ...DEFAULT_CATEGORY_FREQUENCIES,
      ...input.prefs.categoryFrequencies,
    },
  });

  await updateUserNotificationPreferences(input.userId, next);
  await syncMissionHubEmailSuppression({
    userId: input.userId,
    email: input.email,
    prefs: next,
    actorType,
    actorUserId,
  });

  await recordPreferenceDiffEvents({
    userId: input.userId,
    email: input.email,
    previous,
    next,
    actorType,
    actorUserId,
    metadata: input.metadata,
  });

  return next;
}

export async function saveMissionHubEmailPreferences(input: {
  userId: string;
  email: string;
  prefs: Pick<
    NotificationPreferences,
    "email" | "inApp" | "categoryFrequencies" | "mutedSpaceIds"
  >;
  metadata?: Record<string, unknown>;
}): Promise<NotificationPreferences> {
  const current = mergeNotificationPreferences(await getRawPrefs(input.userId));
  return saveMissionHubNotificationPreferences({
    userId: input.userId,
    email: input.email,
    prefs: {
      ...current,
      email: input.prefs.email,
      inApp: input.prefs.inApp,
      mutedSpaceIds: input.prefs.mutedSpaceIds ?? current.mutedSpaceIds,
      categoryFrequencies: {
        ...current.categoryFrequencies,
        ...input.prefs.categoryFrequencies,
      },
    },
    metadata: input.metadata,
  });
}

async function getRawPrefs(userId: string): Promise<unknown> {
  const { prisma } = await import("@/lib/db");
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { communityNotificationPrefs: true },
  });
  return user?.communityNotificationPrefs ?? null;
}

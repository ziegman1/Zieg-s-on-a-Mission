"use server";

import { requireCommunityOwner } from "@/lib/community/owner";
import {
  loadNotificationPreferenceEventSummary30Days,
  loadNotificationPreferenceEventsForAdmin,
  type NotificationPreferenceEventRow,
  type NotificationPreferenceEventSummary30Days,
} from "@/lib/mission-hub/notification-preference-events";
import type { NotificationPreferenceEventType } from "@/lib/mission-hub/notification-preference-event-types";

export async function loadSubscriberActivityAction(input?: {
  eventType?: NotificationPreferenceEventType | "all";
}): Promise<
  | {
      ok: true;
      events: NotificationPreferenceEventRow[];
      summary: NotificationPreferenceEventSummary30Days;
    }
  | { ok: false; error: string }
> {
  const owner = await requireCommunityOwner();
  if (!owner) return { ok: false, error: "Unauthorized" };

  try {
    const [events, summary] = await Promise.all([
      loadNotificationPreferenceEventsForAdmin({
        eventType: input?.eventType ?? "all",
        limit: 75,
      }),
      loadNotificationPreferenceEventSummary30Days(),
    ]);
    return { ok: true, events, summary };
  } catch (e) {
    console.error("[subscriber-activity]", e);
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Could not load subscriber activity. Run pending migrations.",
    };
  }
}

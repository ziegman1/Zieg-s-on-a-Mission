"use server";

import { revalidatePath } from "next/cache";
import type { CommunityNotificationItem } from "@/lib/community/notification-types";
import {
  countUnreadNotifications,
  deleteReadNotificationsForUser,
  listNotificationsGroupedForUser,
  markAllNotificationsRead,
  markNotificationRead,
  requireNotificationRecipientUserId,
} from "@/lib/community/notifications";
import { logMissionHubDiag } from "@/lib/mission-hub/diagnostics-log";

const EMPTY_NOTIFICATIONS = {
  ok: true as const,
  items: [] as CommunityNotificationItem[],
  unread: [] as CommunityNotificationItem[],
  read: [] as CommunityNotificationItem[],
  unreadCount: 0,
};

async function requireUser(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const userId = await requireNotificationRecipientUserId();
  if (!userId) return { ok: false, error: "Sign in to view notifications" };
  return { ok: true, userId };
}

export async function fetchUnreadNotificationCountAction(): Promise<
  { ok: true; count: number } | { ok: false; error: string }
> {
  logMissionHubDiag("notification-actions", "start", "fetchUnreadNotificationCountAction");
  const authResult = await requireUser();
  if (!authResult.ok) return { ok: true, count: 0 };

  try {
    const count = await countUnreadNotifications(authResult.userId);
    logMissionHubDiag("notification-actions", "ok", "fetchUnreadNotificationCountAction", {
      count,
    });
    return { ok: true, count };
  } catch (e) {
    logMissionHubDiag(
      "notification-actions",
      "error",
      "fetchUnreadNotificationCountAction",
      e,
    );
    return { ok: true, count: 0 };
  }
}

export async function listNotificationsAction(): Promise<
  | {
      ok: true;
      items: CommunityNotificationItem[];
      unread: CommunityNotificationItem[];
      read: CommunityNotificationItem[];
      unreadCount: number;
    }
  | { ok: false; error: string }
> {
  const authResult = await requireUser();
  if (!authResult.ok) return authResult;

  logMissionHubDiag("notification-actions", "start", "listNotificationsAction");
  try {
    const [grouped, unreadCount] = await Promise.all([
      listNotificationsGroupedForUser(authResult.userId),
      countUnreadNotifications(authResult.userId),
    ]);
    const items = [...grouped.unread, ...grouped.read];
    logMissionHubDiag("notification-actions", "ok", "listNotificationsAction", {
      unreadCount,
      itemCount: items.length,
    });
    return {
      ok: true,
      items,
      unread: grouped.unread,
      read: grouped.read,
      unreadCount,
    };
  } catch (e) {
    logMissionHubDiag("notification-actions", "error", "listNotificationsAction", e);
    return EMPTY_NOTIFICATIONS;
  }
}

export async function clearReadNotificationsAction(): Promise<
  { ok: true; unreadCount: number } | { ok: false; error: string }
> {
  const authResult = await requireUser();
  if (!authResult.ok) return authResult;

  try {
    await deleteReadNotificationsForUser(authResult.userId);
    const unreadCount = await countUnreadNotifications(authResult.userId);
    revalidatePath("/community");
    return { ok: true, unreadCount };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not clear read notifications" };
  }
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<{ ok: true; unreadCount: number } | { ok: false; error: string }> {
  const authResult = await requireUser();
  if (!authResult.ok) return authResult;

  if (!notificationId?.trim()) return { ok: false, error: "Invalid notification" };

  try {
    await markNotificationRead(authResult.userId, notificationId);
    const unreadCount = await countUnreadNotifications(authResult.userId);
    revalidatePath("/community");
    return { ok: true, unreadCount };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not update notification" };
  }
}

export async function markAllNotificationsReadAction(): Promise<
  { ok: true; unreadCount: number } | { ok: false; error: string }
> {
  const authResult = await requireUser();
  if (!authResult.ok) return authResult;

  try {
    await markAllNotificationsRead(authResult.userId);
    revalidatePath("/community");
    return { ok: true, unreadCount: 0 };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not update notifications" };
  }
}

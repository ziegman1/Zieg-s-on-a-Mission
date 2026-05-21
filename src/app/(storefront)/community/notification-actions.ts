"use server";

import { revalidatePath } from "next/cache";
import type { CommunityNotificationItem } from "@/lib/community/notification-types";
import {
  countUnreadNotifications,
  listRecentNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  requireNotificationRecipientUserId,
} from "@/lib/community/notifications";

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
  const authResult = await requireUser();
  if (!authResult.ok) return { ok: true, count: 0 };

  try {
    const count = await countUnreadNotifications(authResult.userId);
    return { ok: true, count };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not load notifications" };
  }
}

export async function listNotificationsAction(): Promise<
  { ok: true; items: CommunityNotificationItem[]; unreadCount: number } | { ok: false; error: string }
> {
  const authResult = await requireUser();
  if (!authResult.ok) return authResult;

  try {
    const [items, unreadCount] = await Promise.all([
      listRecentNotificationsForUser(authResult.userId),
      countUnreadNotifications(authResult.userId),
    ]);
    return { ok: true, items, unreadCount };
  } catch (e) {
    console.error(e);
    return { ok: false, error: "Could not load notifications" };
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

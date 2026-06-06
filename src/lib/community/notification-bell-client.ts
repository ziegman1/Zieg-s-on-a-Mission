import type { CommunityNotificationItem } from "@/lib/community/notification-types";

export type MarkAllReadSnapshot = {
  unreadItems: CommunityNotificationItem[];
  readItems: CommunityNotificationItem[];
  unreadCount: number;
};

export type MarkAllReadOptimisticResult = {
  unreadItems: CommunityNotificationItem[];
  readItems: CommunityNotificationItem[];
  unreadCount: 0;
};

/** Apply optimistic mark-all-read list/count changes (preserves read collapse state). */
export function applyOptimisticMarkAllRead(
  unreadItems: CommunityNotificationItem[],
  readItems: CommunityNotificationItem[],
  readAt: string,
): MarkAllReadOptimisticResult {
  return {
    unreadItems: [],
    readItems: [...unreadItems.map((n) => ({ ...n, readAt })), ...readItems],
    unreadCount: 0,
  };
}

/** Restore panel state after a failed mark-all-read request. */
export function restoreMarkAllReadSnapshot(
  snapshot: MarkAllReadSnapshot,
): MarkAllReadSnapshot {
  return {
    unreadItems: [...snapshot.unreadItems],
    readItems: [...snapshot.readItems],
    unreadCount: snapshot.unreadCount,
  };
}

/** Prefer hub refresh context count; fall back to local bell state. */
export function resolveDisplayUnreadCount(
  hubUnreadCount: number | undefined,
  localUnreadCount: number,
): number {
  return hubUnreadCount ?? localUnreadCount;
}

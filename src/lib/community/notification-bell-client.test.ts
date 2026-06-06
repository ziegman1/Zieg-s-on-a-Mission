import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import type { CommunityNotificationItem } from "@/lib/community/notification-types";
import {
  applyOptimisticMarkAllRead,
  resolveDisplayUnreadCount,
  restoreMarkAllReadSnapshot,
} from "./notification-bell-client";

function item(id: string, readAt: string | null = null): CommunityNotificationItem {
  return {
    id,
    type: "comment_on_post",
    title: `Notification ${id}`,
    body: null,
    readAt,
    createdAt: "2026-05-24T12:00:00.000Z",
    postId: "post-1",
    commentId: null,
    spaceSlug: "general",
    href: "/community/general#post-1",
  };
}

describe("notification bell client helpers", () => {
  it("applyOptimisticMarkAllRead clears unread and prepends marked read items", () => {
    const unread = [item("u1"), item("u2")];
    const read = [item("r1", "2026-05-24T10:00:00.000Z")];
    const readAt = "2026-05-24T12:30:00.000Z";

    const result = applyOptimisticMarkAllRead(unread, read, readAt);

    expect(result.unreadCount).toBe(0);
    expect(result.unreadItems).toEqual([]);
    expect(result.readItems).toHaveLength(3);
    expect(result.readItems[0]).toMatchObject({ id: "u1", readAt });
    expect(result.readItems[1]).toMatchObject({ id: "u2", readAt });
    expect(result.readItems[2]).toEqual(read[0]);
  });

  it("restoreMarkAllReadSnapshot returns a shallow copy for rollback", () => {
    const snapshot = {
      unreadItems: [item("u1")],
      readItems: [item("r1", "2026-05-24T10:00:00.000Z")],
      unreadCount: 1,
    };

    const restored = restoreMarkAllReadSnapshot(snapshot);

    expect(restored).toEqual(snapshot);
    expect(restored.unreadItems).not.toBe(snapshot.unreadItems);
    expect(restored.readItems).not.toBe(snapshot.readItems);
  });

  it("resolveDisplayUnreadCount prefers hub refresh context count", () => {
    expect(resolveDisplayUnreadCount(5, 0)).toBe(5);
    expect(resolveDisplayUnreadCount(0, 3)).toBe(0);
    expect(resolveDisplayUnreadCount(undefined, 3)).toBe(3);
  });
});

describe("notification bell mark-all-read integration (source)", () => {
  it("uses optimistic helpers and sync dispatch without auto-expanding read section", () => {
    const bell = readFileSync(
      resolve(process.cwd(), "src/components/community/community-notifications-bell.tsx"),
      "utf8",
    );

    expect(bell).toContain("applyOptimisticMarkAllRead");
    expect(bell).toContain("setDisplayedUnreadCount(optimistic.unreadCount)");
    expect(bell).toContain("dispatchMissionHubNotificationsSync");
    expect(bell).toContain("restoreMarkAllReadSnapshot(snapshot)");
    expect(bell).toContain("void loadPanel()");
    expect(bell).toContain("void refreshCount()");
    const markAllStart = bell.indexOf("const handleMarkAllRead");
    const markAllEnd = bell.indexOf("const handleClearRead");
    expect(bell.slice(markAllStart, markAllEnd)).not.toContain("setReadExpanded(true)");
    expect(bell).not.toContain("setUnreadCount(initialUnreadCount)");
    expect(bell).not.toContain("hubRefresh?.unreadCount, hubRefresh");
  });
});

describe("markAllNotificationsRead database behavior", () => {
  it("uses a single bulk updateMany", () => {
    const notifications = readFileSync(
      resolve(process.cwd(), "src/lib/community/notifications.ts"),
      "utf8",
    );

    const fnStart = notifications.indexOf("export async function markAllNotificationsRead");
    const fnEnd = notifications.indexOf("export { newsletterPublishNotificationDedupeKey");
    const fnBody = notifications.slice(fnStart, fnEnd);

    expect(fnBody).toContain("updateMany");
    expect(fnBody).not.toContain("for (");
    expect(fnBody).not.toContain("forEach");
  });
});

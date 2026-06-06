import { describe, expect, it, vi, beforeEach } from "vitest";
import type { CommunityNotificationItem } from "@/lib/community/notification-types";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/community/notifications", () => ({
  countUnreadNotifications: vi.fn(),
  deleteReadNotificationsForUser: vi.fn(),
  listNotificationsGroupedForUser: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
  requireNotificationRecipientUserId: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import {
  countUnreadNotifications,
  deleteReadNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
  requireNotificationRecipientUserId,
} from "@/lib/community/notifications";
import {
  clearReadNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "./notification-actions";

describe("notification read-state actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireNotificationRecipientUserId).mockResolvedValue("user-1");
  });

  it("markAllNotificationsReadAction does not revalidate Mission Hub", async () => {
    vi.mocked(markAllNotificationsRead).mockResolvedValue(3);

    const result = await markAllNotificationsReadAction();

    expect(result).toEqual({ ok: true, unreadCount: 0 });
    expect(markAllNotificationsRead).toHaveBeenCalledWith("user-1");
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("markNotificationReadAction does not revalidate Mission Hub", async () => {
    vi.mocked(markNotificationRead).mockResolvedValue(true);
    vi.mocked(countUnreadNotifications).mockResolvedValue(2);

    const result = await markNotificationReadAction("notif-1");

    expect(result).toEqual({ ok: true, unreadCount: 2 });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("clearReadNotificationsAction does not revalidate Mission Hub", async () => {
    vi.mocked(deleteReadNotificationsForUser).mockResolvedValue(5);
    vi.mocked(countUnreadNotifications).mockResolvedValue(1);

    const result = await clearReadNotificationsAction();

    expect(result).toEqual({ ok: true, unreadCount: 1 });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

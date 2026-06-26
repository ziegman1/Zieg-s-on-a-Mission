"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ChevronDown, ChevronUp, Loader2, Trash2 } from "lucide-react";
import {
  clearReadNotificationsAction,
  fetchUnreadNotificationCountAction,
  listNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(storefront)/community/notification-actions";
import type { CommunityNotificationItem } from "@/lib/community/notification-types";
import { formatCommunityPostDate } from "@/lib/community/format-post-date";
import {
  applyOptimisticMarkAllRead,
  resolveDisplayUnreadCount,
  restoreMarkAllReadSnapshot,
  type MarkAllReadSnapshot,
} from "@/lib/community/notification-bell-client";
import {
  dispatchMissionHubNotificationsSync,
  MISSION_HUB_NOTIFICATIONS_SYNC_EVENT,
  MISSION_HUB_REFRESH_EVENT,
} from "@/lib/community/mission-hub-refresh";
import { cn } from "@/lib/utils";
import { useMissionHubRefreshOptional } from "./mission-hub-refresh-context";
import { CommunityLinkedText } from "./community-linked-text";

function formatNotificationTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
  return formatCommunityPostDate(iso);
}

function NotificationRow({
  item,
  onClick,
}: {
  item: CommunityNotificationItem;
  onClick: (item: CommunityNotificationItem) => void;
}) {
  const router = useRouter();

  function navigate() {
    onClick(item);
    router.push(item.href);
  }

  return (
    <li>
      <div
        role="link"
        tabIndex={0}
        onClick={navigate}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigate();
          }
        }}
        className={cn(
          "block px-3 py-2.5 hover:bg-brand-surface/50 cursor-pointer",
          "transition-[transform,background-color] duration-100 touch-manipulation",
          "active:scale-[0.99] active:bg-black/[0.03]",
          !item.readAt && "bg-brand-primary/[0.05]",
        )}
      >
        <p className="text-xs font-medium text-brand-ink leading-snug pr-1">
          {!item.readAt ? (
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-brand-primary mr-1.5 align-middle"
              aria-hidden
            />
          ) : null}
          {item.title}
        </p>
        {item.body ? (
          <p className="mt-0.5 text-[11px] text-brand-ink/55 line-clamp-2 pl-3.5 whitespace-pre-wrap">
            <CommunityLinkedText
              text={item.body}
              onLinkClick={(event) => event.stopPropagation()}
            />
          </p>
        ) : null}
        <p className="mt-1 text-[10px] text-brand-ink/38 pl-3.5">
          {formatNotificationTime(item.createdAt)}
        </p>
      </div>
    </li>
  );
}

export function CommunityNotificationsBell({
  recipientUserId,
  initialUnreadCount = 0,
}: {
  recipientUserId: string;
  initialUnreadCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(initialUnreadCount);
  const [unreadItems, setUnreadItems] = useState<CommunityNotificationItem[]>([]);
  const [readItems, setReadItems] = useState<CommunityNotificationItem[]>([]);
  const [readExpanded, setReadExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const markAllInFlight = useRef(false);
  const hubRefresh = useMissionHubRefreshOptional();

  const setDisplayedUnreadCount = useCallback(
    (count: number) => {
      hubRefresh?.setUnreadCount(count);
      if (!hubRefresh) {
        setLocalUnreadCount(count);
      }
      dispatchMissionHubNotificationsSync(count);
    },
    [hubRefresh],
  );

  const displayUnreadCount = resolveDisplayUnreadCount(
    hubRefresh?.unreadCount,
    localUnreadCount,
  );

  const refreshCount = useCallback(async () => {
    try {
      const result = await fetchUnreadNotificationCountAction();
      if (result.ok) {
        setDisplayedUnreadCount(result.count);
      }
    } catch (e) {
      console.error("[notifications bell] refresh count failed:", e);
    }
  }, [setDisplayedUnreadCount]);

  const loadPanel = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listNotificationsAction();
      setLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setUnreadItems(result.unread);
      setReadItems(result.read);
      setDisplayedUnreadCount(result.unreadCount);
      if (result.read.length === 0) setReadExpanded(false);
    } catch (e) {
      setLoading(false);
      console.error("[notifications bell] load panel failed:", e);
      setError("Could not load notifications");
    }
  }, [setDisplayedUnreadCount]);

  useEffect(() => {
    if (hubRefresh) return;
    setLocalUnreadCount(initialUnreadCount);
  }, [hubRefresh, initialUnreadCount]);

  useEffect(() => {
    if (!open) return;
    void loadPanel();
  }, [open, loadPanel]);

  useEffect(() => {
    if (hubRefresh) return;
    function onSync(e: Event) {
      const detail = (e as CustomEvent<{ unreadCount: number }>).detail;
      if (typeof detail?.unreadCount === "number") {
        setLocalUnreadCount(detail.unreadCount);
      }
    }
    window.addEventListener(MISSION_HUB_NOTIFICATIONS_SYNC_EVENT, onSync);
    return () => window.removeEventListener(MISSION_HUB_NOTIFICATIONS_SYNC_EVENT, onSync);
  }, [hubRefresh]);

  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (markAllInFlight.current) return;
      void loadPanel();
    }, 45_000);
    return () => clearInterval(id);
  }, [open, loadPanel]);

  useEffect(() => {
    function onFocus() {
      void refreshCount();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshCount]);

  useEffect(() => {
    function onHubRefresh() {
      void refreshCount();
      if (open && !markAllInFlight.current) void loadPanel();
    }
    window.addEventListener(MISSION_HUB_REFRESH_EVENT, onHubRefresh);
    return () => window.removeEventListener(MISSION_HUB_REFRESH_EVENT, onHubRefresh);
  }, [open, refreshCount, loadPanel]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleMarkAllRead = () => {
    const snapshot: MarkAllReadSnapshot = {
      unreadItems: [...unreadItems],
      readItems: [...readItems],
      unreadCount: displayUnreadCount,
    };

    const optimistic = applyOptimisticMarkAllRead(
      snapshot.unreadItems,
      snapshot.readItems,
      new Date().toISOString(),
    );
    setDisplayedUnreadCount(optimistic.unreadCount);
    setUnreadItems(optimistic.unreadItems);
    setReadItems(optimistic.readItems);

    markAllInFlight.current = true;
    startTransition(async () => {
      try {
        const result = await markAllNotificationsReadAction();
        if (!result.ok) {
          const restored = restoreMarkAllReadSnapshot(snapshot);
          setUnreadItems(restored.unreadItems);
          setReadItems(restored.readItems);
          setDisplayedUnreadCount(restored.unreadCount);
          void loadPanel();
          void refreshCount();
        }
      } finally {
        markAllInFlight.current = false;
      }
    });
  };

  const handleClearRead = () => {
    startTransition(async () => {
      const result = await clearReadNotificationsAction();
      if (result.ok) {
        setReadItems([]);
        setDisplayedUnreadCount(result.unreadCount);
        setReadExpanded(false);
      }
    });
  };

  const handleItemClick = (item: CommunityNotificationItem) => {
    if (!item.readAt) {
      startTransition(async () => {
        const result = await markNotificationReadAction(item.id);
        if (result.ok) {
          setDisplayedUnreadCount(result.unreadCount);
          setUnreadItems((prev) => prev.filter((n) => n.id !== item.id));
          setReadItems((prev) => [
            { ...item, readAt: new Date().toISOString() },
            ...prev.filter((n) => n.id !== item.id),
          ]);
          setReadExpanded(true);
        }
      });
    }
    setOpen(false);
  };

  const hasAny = unreadItems.length > 0 || readItems.length > 0;
  const readPreview = readExpanded ? readItems : readItems.slice(0, 3);
  const readHiddenCount = readExpanded ? 0 : Math.max(0, readItems.length - 3);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) {
            startTransition(() => {
              void refreshCount();
            });
          }
        }}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-full",
          "text-brand-ink/55 hover:text-brand-primary hover:bg-brand-surface/80",
          "transition-[transform,background-color,color] duration-75 touch-manipulation",
          "active:scale-[0.98] active:bg-black/[0.06]",
          open && "bg-brand-primary/10 text-brand-primary",
        )}
        aria-label={
          displayUnreadCount > 0
            ? `Notifications, ${displayUnreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {displayUnreadCount > 0 ? (
          <span className="absolute top-0.5 right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-brand-primary px-1 text-[9px] font-bold text-white leading-none shadow-[0_0_0_2px_white] ring-2 ring-brand-primary/25 animate-in zoom-in duration-200">
            {displayUnreadCount > 9 ? "9+" : displayUnreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={cn(
            "absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-1.5rem))]",
            "rounded-2xl border border-black/[0.05] bg-white/98 backdrop-blur-xl",
            "shadow-[0_12px_40px_rgba(28,42,68,0.14)]",
            "overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200",
          )}
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between gap-2 border-b border-black/[0.06] px-3 py-2.5">
            <p className="text-sm font-semibold text-brand-ink">Activity</p>
            <div className="flex items-center gap-2">
              {readItems.length > 0 ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleClearRead}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-ink/45 hover:text-brand-ink/70 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" aria-hidden />
                  Clear read
                </button>
              ) : null}
              {displayUnreadCount > 0 ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-primary hover:underline disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden />
                  Mark all read
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-[min(20rem,50dvh)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-brand-ink/45">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              </div>
            ) : error ? (
              <p className="px-3 py-6 text-center text-xs text-brand-ink/60">{error}</p>
            ) : !hasAny ? (
              <p className="px-3 py-8 text-center text-xs text-brand-ink/55 leading-relaxed">
                No activity yet. When someone comments, reacts, or joins, you&apos;ll see it
                here.
              </p>
            ) : (
              <div className="py-1">
                {unreadItems.length > 0 ? (
                  <div>
                    <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-ink/38">
                      Unread
                    </p>
                    <ul className="divide-y divide-black/[0.04]">
                      {unreadItems.map((item) => (
                        <NotificationRow key={item.id} item={item} onClick={handleItemClick} />
                      ))}
                    </ul>
                  </div>
                ) : null}

                {readItems.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink/38">
                        Read
                      </p>
                      {readItems.length > 3 ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-0.5 text-[10px] font-medium text-brand-ink/45 hover:text-brand-ink/65"
                          onClick={() => setReadExpanded((v) => !v)}
                        >
                          {readExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3" />
                              {readHiddenCount > 0
                                ? `Show ${readHiddenCount} more`
                                : "Show all"}
                            </>
                          )}
                        </button>
                      ) : null}
                    </div>
                    <ul className="divide-y divide-black/[0.04] opacity-80">
                      {readPreview.map((item) => (
                        <NotificationRow key={item.id} item={item} onClick={handleItemClick} />
                      ))}
                    </ul>
                  </div>
                ) : unreadItems.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-brand-ink/50">
                    You&apos;re all caught up.
                  </p>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

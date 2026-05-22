"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import {
  fetchUnreadNotificationCountAction,
  listNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(storefront)/community/notification-actions";
import type { CommunityNotificationItem } from "@/lib/community/notification-types";
import { formatCommunityPostDate } from "@/lib/community/format-post-date";
import { cn } from "@/lib/utils";

function groupNotificationsByRecency(
  items: CommunityNotificationItem[],
): { label: string; items: CommunityNotificationItem[] }[] {
  const now = Date.now();
  const today: CommunityNotificationItem[] = [];
  const earlier: CommunityNotificationItem[] = [];

  for (const item of items) {
    const age = now - new Date(item.createdAt).getTime();
    if (age < 86_400_000) today.push(item);
    else earlier.push(item);
  }

  const groups: { label: string; items: CommunityNotificationItem[] }[] = [];
  if (today.length > 0) groups.push({ label: "Today", items: today });
  if (earlier.length > 0) groups.push({ label: "Earlier", items: earlier });
  return groups;
}

function formatNotificationTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3600_000)}h ago`;
  return formatCommunityPostDate(iso);
}

export function CommunityNotificationsBell({
  recipientUserId,
  initialUnreadCount = 0,
}: {
  recipientUserId: string;
  initialUnreadCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [items, setItems] = useState<CommunityNotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(async () => {
    const result = await fetchUnreadNotificationCountAction();
    if (result.ok) setUnreadCount(result.count);
  }, []);

  const loadPanel = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await listNotificationsAction();
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setItems(result.items);
    setUnreadCount(result.unreadCount);
  }, []);

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  useEffect(() => {
    if (!open) return;
    void loadPanel();
  }, [open, loadPanel]);

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
    startTransition(async () => {
      const result = await markAllNotificationsReadAction();
      if (result.ok) {
        setUnreadCount(0);
        setItems((prev) =>
          prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
        );
      }
    });
  };

  const handleItemClick = (item: CommunityNotificationItem) => {
    if (!item.readAt) {
      startTransition(async () => {
        const result = await markNotificationReadAction(item.id);
        if (result.ok) {
          setUnreadCount(result.unreadCount);
          setItems((prev) =>
            prev.map((n) =>
              n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n,
            ),
          );
        }
      });
    }
    setOpen(false);
  };

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
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute top-0.5 right-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-brand-primary px-1 text-[9px] font-bold text-white leading-none shadow-[0_0_0_2px_white] ring-2 ring-brand-primary/25 animate-in zoom-in duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
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
            {unreadCount > 0 ? (
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

          <div className="max-h-[min(20rem,50dvh)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-brand-ink/45">
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              </div>
            ) : error ? (
              <p className="px-3 py-6 text-center text-xs text-brand-ink/60">{error}</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-brand-ink/55 leading-relaxed">
                No activity yet. When someone comments, reacts, or joins, you&apos;ll see it
                here.
              </p>
            ) : (
              <div className="py-1">
                {groupNotificationsByRecency(items).map((group) => (
                  <div key={group.label}>
                    <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-ink/38">
                      {group.label}
                    </p>
                    <ul className="divide-y divide-black/[0.04]">
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            prefetch
                            onClick={() => handleItemClick(item)}
                            className={cn(
                              "block px-3 py-2.5 hover:bg-brand-surface/50",
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
                              <p className="mt-0.5 text-[11px] text-brand-ink/55 line-clamp-2 pl-3.5">
                                {item.body}
                              </p>
                            ) : null}
                            <p className="mt-1 text-[10px] text-brand-ink/38 pl-3.5">
                              {formatNotificationTime(item.createdAt)}
                            </p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

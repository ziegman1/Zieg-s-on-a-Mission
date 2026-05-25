"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  canStartPullToRefresh,
  nextPullTouchState,
  pullToRefreshOffsetPx,
  pullToRefreshProgress,
  shouldTriggerPullToRefresh,
  type PullToRefreshTouchState,
} from "@/lib/community/mission-hub-pull-to-refresh";
import { useMissionHubRefresh } from "./mission-hub-refresh-context";
import { cn } from "@/lib/utils";

function getScrollTop(): number {
  if (typeof window === "undefined") return 0;
  return window.scrollY || document.documentElement.scrollTop || 0;
}

export function MissionHubPullToRefresh({ children }: { children: React.ReactNode }) {
  const { refresh, isRefreshing } = useMissionHubRefresh();
  const [pullPx, setPullPx] = useState(0);
  const [touch, setTouch] = useState<PullToRefreshTouchState>({
    active: false,
    startY: 0,
    pullPx: 0,
  });
  const triggeredRef = useRef(false);

  const indicatorOffset = pullToRefreshOffsetPx(pullPx);
  const progress = pullToRefreshProgress(pullPx);
  const showIndicator = pullPx > 4 || isRefreshing;

  const finishPull = useCallback(
    async (releasedPullPx: number) => {
      setTouch({ active: false, startY: 0, pullPx: 0 });
      setPullPx(0);
      if (shouldTriggerPullToRefresh(releasedPullPx) && !triggeredRef.current) {
        triggeredRef.current = true;
        try {
          await refresh("pull", { force: true });
        } finally {
          triggeredRef.current = false;
        }
      }
    },
    [refresh],
  );

  useEffect(() => {
    const opts = { passive: false } as AddEventListenerOptions;

    function onTouchStart(e: TouchEvent) {
      if (isRefreshing) return;
      if (!canStartPullToRefresh(getScrollTop())) return;
      const y = e.touches[0]?.clientY ?? 0;
      setTouch({ active: true, startY: y, pullPx: 0 });
      setPullPx(0);
    }

    function onTouchMove(e: TouchEvent) {
      setTouch((prev) => {
        if (!prev.active) return prev;
        const y = e.touches[0]?.clientY ?? 0;
        const next = nextPullTouchState(prev, y, getScrollTop());
        if (next.pullPx > 0 && canStartPullToRefresh(getScrollTop())) {
          e.preventDefault();
        }
        setPullPx(next.pullPx);
        return next;
      });
    }

    function onTouchEnd() {
      setTouch((prev) => {
        if (!prev.active) return prev;
        void finishPull(prev.pullPx);
        return { active: false, startY: 0, pullPx: 0 };
      });
    }

    window.addEventListener("touchstart", onTouchStart, opts);
    window.addEventListener("touchmove", onTouchMove, opts);
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [finishPull, isRefreshing]);

  return (
    <div className="relative min-h-0 flex-1 flex flex-col">
      <div
        aria-hidden={!showIndicator}
        className={cn(
          "pointer-events-none fixed left-0 right-0 z-[60] flex justify-center",
          "transition-[opacity,transform] duration-200 ease-out",
          "top-[calc(env(safe-area-inset-top)+3.25rem)]",
          !showIndicator && "opacity-0 -translate-y-2",
        )}
        style={{
          transform: showIndicator
            ? `translateY(${indicatorOffset}px)`
            : undefined,
        }}
      >
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full",
            "bg-white/95 shadow-[0_4px_16px_rgba(28,42,68,0.12)] border border-black/[0.06]",
          )}
        >
          <Loader2
            className={cn(
              "h-4 w-4 text-brand-primary",
              (isRefreshing || progress > 0.35) && "animate-spin",
            )}
            style={
              !isRefreshing
                ? { transform: `rotate(${progress * 320}deg)` }
                : undefined
            }
            aria-hidden
          />
        </div>
      </div>
      <div
        className={cn(
          "flex-1 flex flex-col transition-transform duration-200 ease-out",
          touch.active && pullPx > 0 && "motion-reduce:transition-none",
        )}
        style={
          touch.active && pullPx > 0
            ? { transform: `translateY(${indicatorOffset * 0.35}px)` }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}

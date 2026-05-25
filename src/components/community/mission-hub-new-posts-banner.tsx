"use client";

import { ArrowDown } from "lucide-react";
import { useMissionHubRefresh } from "./mission-hub-refresh-context";
import { cn } from "@/lib/utils";

export function MissionHubNewPostsBanner() {
  const { feedHasUpdates, acknowledgeFeedUpdates, isRefreshing } = useMissionHubRefresh();

  if (!feedHasUpdates) return null;

  return (
    <div
      className={cn(
        "fixed left-1/2 z-[55] -translate-x-1/2",
        "top-[calc(env(safe-area-inset-top)+4.5rem)]",
        "animate-in fade-in slide-in-from-top-3 duration-300",
      )}
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        disabled={isRefreshing}
        onClick={() => acknowledgeFeedUpdates()}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2",
          "bg-brand-primary text-white text-xs font-semibold shadow-lg",
          "touch-manipulation active:scale-[0.98] transition-transform",
          "disabled:opacity-70",
        )}
      >
        <ArrowDown className="h-3.5 w-3.5" aria-hidden />
        New posts available
      </button>
    </div>
  );
}

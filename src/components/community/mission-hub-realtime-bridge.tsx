"use client";

import { useEffect, useRef } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import {
  isMissionHubRealtimeConfigured,
  missionHubNotificationRealtimeFilter,
  MISSION_HUB_REALTIME_TABLES,
} from "@/lib/community/mission-hub-realtime";
import { getSupabaseAnonKey, getSupabaseProjectUrl } from "@/lib/supabase/config-env";
import { useMissionHubRefreshOptional } from "./mission-hub-refresh-context";

/**
 * Phase 2: Supabase Realtime for feed + notification badge.
 * No-ops when env is missing or RLS blocks client reads.
 */
export function MissionHubRealtimeBridge({
  notificationUserId = null,
}: {
  notificationUserId?: string | null;
}) {
  const hub = useMissionHubRefreshOptional();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!notificationUserId || !hub) return;
    if (!isMissionHubRealtimeConfigured()) return;

    const url = getSupabaseProjectUrl();
    const anonKey = getSupabaseAnonKey();
    if (!url || !anonKey) return;

    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const channel = supabase
      .channel(`mh-${notificationUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: MISSION_HUB_REALTIME_TABLES.notifications,
          filter: missionHubNotificationRealtimeFilter(notificationUserId),
        },
        () => {
          if (process.env.NODE_ENV !== "production") {
            console.info("[mission-hub-diag]", {
              subsystem: "realtime-bridge",
              phase: "refresh",
              table: MISSION_HUB_REALTIME_TABLES.notifications,
            });
          }
          void hub.refresh("realtime", { force: false });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: MISSION_HUB_REALTIME_TABLES.posts,
        },
        () => {
          if (process.env.NODE_ENV !== "production") {
            console.info("[mission-hub-diag]", {
              subsystem: "realtime-bridge",
              phase: "refresh",
              table: MISSION_HUB_REALTIME_TABLES.posts,
            });
          }
          void hub.refresh("realtime", { force: false });
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [notificationUserId, hub]);

  return null;
}

/**
 * Mission Hub realtime preparation (Phase 2).
 * Subscriptions activate only when Supabase URL + anon key are configured.
 * RLS policies on community tables must allow recipient-scoped reads before going live.
 */

import { getSupabaseAnonKey, getSupabaseProjectUrl } from "@/lib/supabase/config-env";

export const MISSION_HUB_REALTIME_CHANNELS = {
  notifications: "mission-hub:notifications",
  posts: "mission-hub:posts",
} as const;

export type MissionHubRealtimeTable =
  | "community_notifications"
  | "community_posts"
  | "community_post_comments";

/** Supabase Realtime postgres_changes table names (match Prisma @@map). */
export const MISSION_HUB_REALTIME_TABLES: Record<
  "notifications" | "posts" | "comments",
  MissionHubRealtimeTable
> = {
  notifications: "community_notifications",
  posts: "community_posts",
  comments: "community_post_comments",
};

export function isMissionHubRealtimeConfigured(): boolean {
  return Boolean(getSupabaseProjectUrl() && getSupabaseAnonKey());
}

/** Postgres changes filter for notification badge updates. */
export function missionHubNotificationRealtimeFilter(recipientUserId: string): string {
  return `recipient_user_id=eq.${recipientUserId}`;
}

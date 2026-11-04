"use client";

import type { AnalyticsEventType } from "./constants";
import { isAnalyticsEngagementEnabled } from "./engagement-flag";
import { touchClientSession } from "./session-id";

export { isAnalyticsEngagementEnabled } from "./engagement-flag";

type TrackPayload = {
  type: AnalyticsEventType;
  path: string;
  metadata?: Record<string, string | number>;
};

const queue: TrackPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let lastPageViewKey = "";
let lastPageViewAt = 0;

function prefersNoTracking(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.doNotTrack === "1" || navigator.doNotTrack === "yes";
}

function isEngagementOrCtaEvent(type: AnalyticsEventType): boolean {
  return type !== "page_view";
}

function sendBeaconOrFetch(body: string): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon("/api/track", blob)) return;
    }
  } catch {
    // fall through
  }
  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function flush(): void {
  flushTimer = null;
  if (!queue.length) return;
  const session = touchClientSession();
  if (!session?.id) {
    queue.length = 0;
    return;
  }
  const events = queue.splice(0, 20).map((e) => ({
    type: e.type,
    path: e.path,
    metadata: e.metadata,
  }));
  const body = JSON.stringify({ sessionId: session.id, events });
  sendBeaconOrFetch(body);
}

function scheduleFlush(): void {
  if (flushTimer != null) return;
  flushTimer = setTimeout(flush, 400);
}

/**
 * Queue an analytics event. Safe no-op on failure.
 * Engagement/CTA require NEXT_PUBLIC_ANALYTICS_ENGAGEMENT_ENABLED and are skipped under DNT.
 * page_view still records (existing first-party behavior).
 */
export function trackAnalyticsEvent(
  type: AnalyticsEventType,
  path: string,
  metadata?: Record<string, string | number>,
): void {
  if (typeof window === "undefined") return;
  if (isEngagementOrCtaEvent(type) && !isAnalyticsEngagementEnabled()) return;
  if (prefersNoTracking() && type !== "page_view") return;
  try {
    queue.push({ type, path, metadata });
    scheduleFlush();
  } catch {
    // never break UX
  }
}

export function trackPageView(path: string): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const key = path;
  if (key === lastPageViewKey && now - lastPageViewAt < 2000) return;
  lastPageViewKey = key;
  lastPageViewAt = now;
  trackAnalyticsEvent("page_view", path);
}

export function trackCtaClick(
  type: Extract<
    AnalyticsEventType,
    | "partner_with_us_click"
    | "external_giving_link_click"
    | "mission_hub_entry_click"
    | "mission_hub_join_click"
  >,
  path: string,
  metadata?: Record<string, string | number>,
): void {
  trackAnalyticsEvent(type, path, metadata);
}

/** Flush immediately (e.g. before external navigation). */
export function flushAnalytics(): void {
  if (flushTimer != null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  flush();
}

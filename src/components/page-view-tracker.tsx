"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  ACTIVE_TIME_BUCKETS_MS,
  SCROLL_DEPTHS,
} from "@/lib/analytics/constants";
import {
  flushAnalytics,
  trackAnalyticsEvent,
  trackPageView,
} from "@/lib/analytics/client";
import { isAnalyticsCollectionAllowed } from "@/lib/analytics/privacy-client";
import { touchClientSession } from "@/lib/analytics/session-id";
import { useAnalyticsPrivacyOptional } from "./analytics-privacy-provider";

/**
 * Storefront analytics: SPA page views, throttled engagement, short-lived session.
 * Failures never break navigation. Mission Hub activity system is untouched.
 * Collection is gated by regional privacy (EEA/UK/unknown require opt-in).
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const privacy = useAnalyticsPrivacyOptional();
  const collectionAllowed = privacy?.collectionAllowed ?? isAnalyticsCollectionAllowed();
  const privacyReady = privacy?.ready ?? false;

  const prevPathRef = useRef<string | null>(null);
  const scrollFiredRef = useRef<Set<number>>(new Set());
  const activeBucketRef = useRef(0);
  const activeAccumRef = useRef(0);
  const lastTickRef = useRef<number | null>(null);

  // Page views + internal nav on App Router pathname changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!privacyReady || !collectionAllowed) {
      touchClientSession(Date.now(), { allowDeviceStorage: false });
      return;
    }
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    touchClientSession(Date.now(), { allowDeviceStorage: true });
    const prev = prevPathRef.current;
    if (prev && prev !== pathname) {
      trackAnalyticsEvent("internal_nav", pathname, { from: prev, to: pathname });
    }
    prevPathRef.current = pathname;
    scrollFiredRef.current = new Set();
    activeBucketRef.current = 0;
    activeAccumRef.current = 0;
    trackPageView(pathname);
  }, [pathname, privacyReady, collectionAllowed]);

  // Scroll depth (once per threshold per path)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!privacyReady || !collectionAllowed) return;
    if (!pathname || pathname.startsWith("/admin")) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (!isAnalyticsCollectionAllowed()) return;
        const doc = document.documentElement;
        const scrollTop = window.scrollY || doc.scrollTop;
        const height = doc.scrollHeight - window.innerHeight;
        if (height <= 0) {
          if (!scrollFiredRef.current.has(100)) {
            scrollFiredRef.current.add(100);
            trackAnalyticsEvent("scroll_depth", pathname, { depth: 100 });
          }
          return;
        }
        const pct = Math.min(100, Math.round((scrollTop / height) * 100));
        for (const depth of SCROLL_DEPTHS) {
          if (pct >= depth && !scrollFiredRef.current.has(depth)) {
            scrollFiredRef.current.add(depth);
            trackAnalyticsEvent("scroll_depth", pathname, { depth });
          }
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname, privacyReady, collectionAllowed]);

  // Coarse active time — only when visible and focused
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!privacyReady || !collectionAllowed) return;
    if (!pathname || pathname.startsWith("/admin")) return;

    const tick = () => {
      if (!isAnalyticsCollectionAllowed()) return;
      const now = Date.now();
      const visible =
        document.visibilityState === "visible" &&
        (typeof document.hasFocus !== "function" || document.hasFocus());
      if (!visible) {
        lastTickRef.current = null;
        return;
      }
      if (lastTickRef.current == null) {
        lastTickRef.current = now;
        return;
      }
      const delta = Math.min(5_000, now - lastTickRef.current);
      lastTickRef.current = now;
      if (delta < 400) return;
      activeAccumRef.current += delta;
      const ms = activeAccumRef.current;
      for (const bucket of ACTIVE_TIME_BUCKETS_MS) {
        if (ms >= bucket && activeBucketRef.current < bucket) {
          activeBucketRef.current = bucket;
          trackAnalyticsEvent("active_time", pathname, { bucketMs: bucket });
        }
      }
    };

    const interval = window.setInterval(tick, 2_500);
    const onVis = () => {
      if (document.visibilityState !== "visible") lastTickRef.current = null;
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onVis);
    window.addEventListener("focus", () => {
      lastTickRef.current = Date.now();
    });
    window.addEventListener("pagehide", flushAnalytics);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onVis);
      window.removeEventListener("pagehide", flushAnalytics);
    };
  }, [pathname, privacyReady, collectionAllowed]);

  return null;
}

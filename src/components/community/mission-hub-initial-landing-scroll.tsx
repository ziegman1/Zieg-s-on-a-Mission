"use client";

import { useEffect, useRef } from "react";
import type { MissionHubLandingMode } from "@/lib/community/mission-hub-scroll";
import {
  missionHubPostHashFromLocation,
  scrollLatestPostIntoView,
  scrollMissionHubPostIntoView,
  scrollMissionHubToTop,
  shouldSkipInitialLandingScroll,
} from "@/lib/community/mission-hub-scroll";

export type MissionHubInitialLandingScrollProps = {
  mode: MissionHubLandingMode;
  /** Latest published post in the feed (first item when sorted desc). */
  latestPostId?: string | null;
  /** Unique key per navigation — landing runs once per key. */
  routeKey: string;
};

/**
 * Applies Mission Hub initial landing position once per route.
 * Does not run on passive refresh, polling, or when the user has already scrolled.
 */
export function MissionHubInitialLandingScroll({
  mode,
  latestPostId,
  routeKey,
}: MissionHubInitialLandingScrollProps) {
  const appliedRef = useRef<Set<string>>(new Set());
  const userScrolledRef = useRef(false);

  useEffect(() => {
    function onUserScroll() {
      if (window.scrollY > 6) userScrolledRef.current = true;
    }
    window.addEventListener("scroll", onUserScroll, { passive: true });
    return () => window.removeEventListener("scroll", onUserScroll);
  }, []);

  useEffect(() => {
    if (appliedRef.current.has(routeKey)) return;

    const hash = window.location.hash;
    const postIdFromHash = missionHubPostHashFromLocation(hash);

    if (postIdFromHash) {
      const scrollToHash = () => {
        scrollMissionHubPostIntoView(postIdFromHash, {
          behavior: "instant",
          hashNavigation: true,
        });
      };
      scrollToHash();
      const timer = window.setTimeout(scrollToHash, 120);
      appliedRef.current.add(routeKey);
      return () => window.clearTimeout(timer);
    }

    if (
      shouldSkipInitialLandingScroll({
        hash,
        userScrolled: userScrolledRef.current,
        mode,
      })
    ) {
      appliedRef.current.add(routeKey);
      return;
    }

    const runLanding = () => {
      if (userScrolledRef.current) {
        appliedRef.current.add(routeKey);
        return;
      }

      if (mode === "hero") {
        scrollMissionHubToTop("instant");
        appliedRef.current.add(routeKey);
        return;
      }

      if (mode === "latestPost" && latestPostId) {
        scrollLatestPostIntoView(latestPostId, { behavior: "instant" });
        appliedRef.current.add(routeKey);
        return;
      }

      appliedRef.current.add(routeKey);
    };

    const raf = requestAnimationFrame(() => {
      runLanding();
      window.setTimeout(runLanding, 80);
    });

    return () => cancelAnimationFrame(raf);
  }, [mode, latestPostId, routeKey]);

  return null;
}

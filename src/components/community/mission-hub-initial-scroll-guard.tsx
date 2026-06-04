"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  missionHubPostHashFromLocation,
  scrollMissionHubPostIntoView,
} from "@/lib/community/mission-hub-scroll";

/**
 * On Mission Hub feed routes: stay at top on entry unless the URL targets a post hash.
 * Does not run on passive router.refresh().
 */
export function MissionHubInitialScrollGuard() {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname.startsWith("/community")) return;
    if (pathname.startsWith("/community/login") || pathname.startsWith("/community/join")) {
      return;
    }

    const pathChanged = lastPathRef.current !== pathname;
    lastPathRef.current = pathname;

    if (!pathChanged) return;

    const postId = missionHubPostHashFromLocation(window.location.hash);
    if (postId) {
      const scrollToHash = () => {
        scrollMissionHubPostIntoView(postId, {
          behavior: "instant",
          hashNavigation: true,
        });
      };
      scrollToHash();
      const id = window.setTimeout(scrollToHash, 100);
      return () => window.clearTimeout(id);
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

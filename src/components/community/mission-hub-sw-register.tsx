"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { MISSION_HUB_PWA } from "@/lib/community/mission-hub-pwa";

/**
 * Registers the Mission Hub service worker on /community routes only.
 */
export function MissionHubSwRegister() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith("/community")) return;
    if (!("serviceWorker" in navigator)) return;

    const scope = `${MISSION_HUB_PWA.scope}/`;

    navigator.serviceWorker
      .register(MISSION_HUB_PWA.serviceWorkerPath, { scope })
      .catch((err) => {
        if (process.env.NODE_ENV === "development") {
          console.warn("[Mission Hub] service worker registration failed:", err);
        }
      });
  }, [pathname]);

  return null;
}

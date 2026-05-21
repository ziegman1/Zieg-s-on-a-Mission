"use client";

import { useEffect } from "react";

/**
 * Marks the document when Mission Hub runs as an installed PWA (standalone display).
 * Enables safe-area and layout tweaks via `.mission-hub-standalone` in CSS.
 */
export function MissionHubStandaloneInit() {
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const apply = () => {
      const standalone =
        mq.matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;
      document.documentElement.classList.toggle("mission-hub-standalone", standalone);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return null;
}

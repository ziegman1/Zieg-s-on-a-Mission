"use client";

import { flushAnalytics, trackCtaClick } from "./client";

/** Fire Mission Hub entry/join CTA events for first-party nav links. */
export function trackStorefrontNavCta(href: string): void {
  const pathOnly = href.split("?")[0]?.split("#")[0] ?? href;
  const current = typeof window !== "undefined" ? window.location.pathname : "/";

  if (pathOnly === "/community/join" || pathOnly.startsWith("/community/join/")) {
    trackCtaClick("mission_hub_join_click", current, {
      cta: "mission_hub_join_click",
      to: pathOnly,
    });
    flushAnalytics();
    return;
  }

  if (
    (pathOnly === "/community" || pathOnly.startsWith("/community/")) &&
    !pathOnly.startsWith("/community/login")
  ) {
    trackCtaClick("mission_hub_entry_click", current, {
      cta: "mission_hub_entry_click",
      to: pathOnly,
    });
    flushAnalytics();
  }
}

/**
 * Mission Hub PWA — manifest, service worker, install hint constants.
 * Scoped to /community.
 */

/** localStorage key — set to "1" when user dismisses the install hint */
export const MISSION_HUB_INSTALL_HINT_DISMISSED_KEY = "mission-hub-install-hint-dismissed";

export const MISSION_HUB_PWA = {
  name: "Zieg's On a Mission",
  shortName: "Mission Hub",
  description:
    "Mission Hub community — spaces, posts, and connection with Zieg's On a Mission.",
  /** Brand primary — status bar / browser chrome */
  themeColor: "#83b0da",
  /** Hub shell background */
  backgroundColor: "#ebe8e4",
  startUrl: "/community",
  scope: "/community",
  /** Must live under /community/ so registration scope can be /community/ */
  serviceWorkerPath: "/community/sw.js",
  manifestPath: "/mission-hub/manifest.webmanifest",
  /** Precached by the service worker (static only) */
  precachePaths: [
    "/mission-hub/manifest.webmanifest",
    "/mission-hub/apple-touch-icon.png",
    "/mission-hub/icon-192.png",
    "/mission-hub/icon-512.png",
  ] as const,
  icons: {
    /** 180×180 recommended for iOS home screen */
    apple: "/mission-hub/apple-touch-icon.png",
    any: [
      { url: "/mission-hub/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/mission-hub/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
} as const;

/** Web app manifest body (kept in sync with public/mission-hub/manifest.webmanifest). */
export function missionHubManifestJson(): Record<string, unknown> {
  const { name, shortName, description, themeColor, backgroundColor, startUrl, scope, icons } =
    MISSION_HUB_PWA;

  return {
    name,
    short_name: shortName,
    description,
    start_url: startUrl,
    scope,
    id: startUrl,
    display: "standalone",
    orientation: "portrait-primary",
    background_color: backgroundColor,
    theme_color: themeColor,
    categories: ["social", "lifestyle"],
    icons: [
      {
        src: icons.any[0].url,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: icons.any[1].url,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: icons.any[1].url,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

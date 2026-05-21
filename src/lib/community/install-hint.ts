/** Client-side helpers for Mission Hub install hint (browser only). */

import { MISSION_HUB_INSTALL_HINT_DISMISSED_KEY } from "./mission-hub-pwa";

export function isInstallHintDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(MISSION_HUB_INSTALL_HINT_DISMISSED_KEY) === "1";
  } catch {
    return true;
  }
}

export function dismissInstallHint(): void {
  try {
    localStorage.setItem(MISSION_HUB_INSTALL_HINT_DISMISSED_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearInstallHintDismissal(): void {
  try {
    localStorage.removeItem(MISSION_HUB_INSTALL_HINT_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)");
  const nav = navigator as Navigator & { standalone?: boolean };
  return mq.matches || nav.standalone === true;
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function isAndroidDevice(): boolean {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

/** Coarse mobile — used to show manual install steps on phone/tablet */
export function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

export type InstallHintPlatform = "ios" | "android" | "desktop";

export function getInstallHintPlatform(): InstallHintPlatform {
  if (isIosDevice()) return "ios";
  if (isAndroidDevice()) return "android";
  return "desktop";
}

export function getInstallHintInstructions(platform: InstallHintPlatform): string {
  switch (platform) {
    case "ios":
      return "Tap Share, then Add to Home Screen.";
    case "android":
      return "Tap Install app or Add to Home screen.";
    default:
      return "Use your browser menu to install Mission Hub.";
  }
}

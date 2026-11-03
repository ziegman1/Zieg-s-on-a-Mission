import { MAX_PATH_LENGTH } from "./constants";

/**
 * Normalize to a first-party pathname only (no query, hash, or external URL).
 * Returns null when the value is untrusted.
 */
export function normalizeAnalyticsPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let value = raw.trim();
  if (!value) return null;

  try {
    if (/^https?:\/\//i.test(value)) {
      const url = new URL(value);
      value = url.pathname;
    }
  } catch {
    return null;
  }

  const q = value.indexOf("?");
  if (q >= 0) value = value.slice(0, q);
  const h = value.indexOf("#");
  if (h >= 0) value = value.slice(0, h);

  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/admin") || value.startsWith("/api")) return null;
  if (value.length > MAX_PATH_LENGTH) value = value.slice(0, MAX_PATH_LENGTH);
  if (!/^\/[\w\-./@%]*$/i.test(value)) return null;

  if (value.length > 1 && value.endsWith("/")) value = value.slice(0, -1);
  return value || "/";
}

export function isMinistryFunnelPath(path: string): {
  ourMission: boolean;
  givingPage: boolean;
} {
  return {
    ourMission: path === "/our-mission",
    givingPage:
      path === "/ministry-funding" ||
      path === "/give" ||
      path === "/partner" ||
      path === "/advocacy-team",
  };
}

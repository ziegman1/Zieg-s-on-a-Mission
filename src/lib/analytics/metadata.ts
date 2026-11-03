import {
  ACTIVE_TIME_BUCKETS_MS,
  CTA_EVENT_TYPES,
  MAX_METADATA_KEYS,
  MAX_METADATA_VALUE_LENGTH,
  SCROLL_DEPTHS,
  type AnalyticsEventType,
} from "./constants";

const ALLOWED_META_KEYS = new Set([
  "depth",
  "bucketMs",
  "from",
  "to",
  "cta",
  "hrefHost",
]);

/**
 * Strip client metadata to an allowlisted, size-bounded object.
 * Never accepts trafficClass, activeMs raw claims beyond buckets, emails, etc.
 */
export function sanitizeEventMetadata(
  eventType: AnalyticsEventType,
  raw: unknown,
): Record<string, string | number> | null {
  if (raw == null) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return null;

  const input = raw as Record<string, unknown>;
  const out: Record<string, string | number> = {};
  let keys = 0;

  for (const [key, value] of Object.entries(input)) {
    if (!ALLOWED_META_KEYS.has(key)) continue;
    if (keys >= MAX_METADATA_KEYS) break;

    if (key === "depth" && eventType === "scroll_depth") {
      const n = typeof value === "number" ? value : Number(value);
      if (SCROLL_DEPTHS.includes(n as (typeof SCROLL_DEPTHS)[number])) {
        out.depth = n;
        keys += 1;
      }
      continue;
    }

    if (key === "bucketMs" && eventType === "active_time") {
      const n = typeof value === "number" ? value : Number(value);
      if (ACTIVE_TIME_BUCKETS_MS.includes(n as (typeof ACTIVE_TIME_BUCKETS_MS)[number])) {
        out.bucketMs = n;
        keys += 1;
      }
      continue;
    }

    if ((key === "from" || key === "to") && typeof value === "string") {
      const trimmed = value.trim().slice(0, MAX_METADATA_VALUE_LENGTH);
      if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
        out[key] = trimmed;
        keys += 1;
      }
      continue;
    }

    if (key === "cta" && typeof value === "string") {
      const trimmed = value.trim().slice(0, 64);
      if (/^[\w.-]+$/.test(trimmed)) {
        out.cta = trimmed;
        keys += 1;
      }
      continue;
    }

    if (key === "hrefHost" && typeof value === "string") {
      const host = value.trim().toLowerCase().slice(0, 120);
      if (/^[a-z0-9.-]+$/.test(host)) {
        out.hrefHost = host;
        keys += 1;
      }
    }
  }

  if (
    (CTA_EVENT_TYPES as readonly string[]).includes(eventType) &&
    Object.keys(out).length === 0
  ) {
    return null;
  }

  return Object.keys(out).length ? out : null;
}

/**
 * First-party storefront analytics constants.
 * Classification is best-effort; never claim proven personhood.
 */

/**
 * @deprecated Prefer resolveCutoffDisplay() / ANALYTICS_CLASSIFICATION_CUTOFF_ISO env.
 * Provisional fallback only — not the activation clock.
 */
export { ANALYTICS_CLASSIFICATION_CUTOFF_FALLBACK_ISO as ANALYTICS_CLASSIFICATION_CUTOFF_ISO } from "./cutoff";

export const ANALYTICS_RETENTION_DAYS = 90;

/** Minimum session age before traffic may be elevated to likely_human. */
export const MIN_HUMAN_SESSION_AGE_MS = 10_000;

/** Engagement events must span at least this long before likely_human. */
export const MIN_HUMAN_ENGAGEMENT_SPAN_MS = 5_000;

/** Rotate session after this much inactivity (client + server soft check). */
export const SESSION_INACTIVITY_MS = 30 * 60 * 1000;

/** Absolute max session lifetime from creation. */
export const SESSION_MAX_LIFETIME_MS = 12 * 60 * 60 * 1000;

export const TRAFFIC_CLASSES = ["likely_human", "likely_bot", "unverified"] as const;
export type TrafficClass = (typeof TRAFFIC_CLASSES)[number];

export const UA_CATEGORIES = ["browser", "bot", "automation", "unknown"] as const;
export type UaCategory = (typeof UA_CATEGORIES)[number];

export const CLASS_SOURCES = ["ua", "engagement", "combined"] as const;
export type ClassSource = (typeof CLASS_SOURCES)[number];

/** Ministry + engagement event allowlist. */
export const ANALYTICS_EVENT_TYPES = [
  "page_view",
  "scroll_depth",
  "active_time",
  "internal_nav",
  "our_mission_view",
  "partner_with_us_click",
  "giving_page_visit",
  "external_giving_link_click",
  "mission_hub_entry_click",
  "mission_hub_join_click",
  "newsletter_signup_complete",
  "contact_submission_complete",
] as const;

export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export const CTA_EVENT_TYPES = [
  "our_mission_view",
  "partner_with_us_click",
  "giving_page_visit",
  "external_giving_link_click",
  "mission_hub_entry_click",
  "mission_hub_join_click",
  "newsletter_signup_complete",
  "contact_submission_complete",
] as const;

export const SCROLL_DEPTHS = [25, 50, 75, 100] as const;

/** Active time buckets (ms upper bounds) the client may report. */
export const ACTIVE_TIME_BUCKETS_MS = [5_000, 15_000, 30_000, 60_000, 120_000] as const;

export const MAX_EVENTS_PER_REQUEST = 20;
export const MAX_PAYLOAD_BYTES = 8_192;
export const MAX_EVENTS_PER_SESSION_PER_MINUTE = 60;
export const MAX_PATH_LENGTH = 200;
export const MAX_METADATA_KEYS = 6;
export const MAX_METADATA_VALUE_LENGTH = 120;

/** Page-view dedupe window (same session + path). */
export const PAGE_VIEW_DEDUPE_MS = 2_000;

/** Human classification requires at least this many independent engagement signal families. */
export const HUMAN_SIGNAL_THRESHOLD = 2;

export const SESSION_STORAGE_KEY = "zoam_analytics_session_v1";

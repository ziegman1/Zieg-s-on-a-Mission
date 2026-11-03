import {
  HUMAN_SIGNAL_THRESHOLD,
  MIN_HUMAN_ENGAGEMENT_SPAN_MS,
  MIN_HUMAN_SESSION_AGE_MS,
  type ClassSource,
  type TrafficClass,
  type UaCategory,
} from "./constants";

/** Recognizable crawler / bot tokens → short signal codes (never store full UA). */
const BOT_UA_RULES: { pattern: RegExp; code: string }[] = [
  { pattern: /googlebot/i, code: "ua:googlebot" },
  { pattern: /bingbot|bingpreview/i, code: "ua:bingbot" },
  { pattern: /slurp/i, code: "ua:yahoo" },
  { pattern: /duckduckbot/i, code: "ua:duckduckbot" },
  { pattern: /baiduspider/i, code: "ua:baidu" },
  { pattern: /yandex(bot|images)/i, code: "ua:yandex" },
  { pattern: /facebookexternalhit|facebot/i, code: "ua:facebook" },
  { pattern: /twitterbot/i, code: "ua:twitter" },
  { pattern: /linkedinbot/i, code: "ua:linkedin" },
  { pattern: /applebot/i, code: "ua:applebot" },
  { pattern: /semrushbot|ahrefsbot|mj12bot|dotbot|petalbot|bytespider/i, code: "ua:seo_crawler" },
  { pattern: /gptbot|chatgpt-user|claudebot|anthropic-ai|ccbot|perplexitybot/i, code: "ua:ai_crawler" },
  { pattern: /amazonbot|ia_archiver|archive\.org_bot/i, code: "ua:archive" },
  { pattern: /pingdom|uptimerobot|statuscake|site24x7|better uptime|headlesschrome/i, code: "ua:monitor" },
  { pattern: /\bbot\b|\bcrawler\b|\bspider\b/i, code: "ua:generic_bot" },
];

const AUTOMATION_UA_RULES: { pattern: RegExp; code: string }[] = [
  { pattern: /puppeteer|playwright|phantomjs|selenium|webdriver|cypress/i, code: "ua:automation" },
  { pattern: /curl\/|wget\/|python-requests|go-http-client|java\/|libwww-perl|httpclient/i, code: "ua:http_client" },
];

const BROWSER_HINT =
  /mozilla\/|chrome\/|safari\/|firefox\/|edg\/|opr\/|crios\/|fxios\//i;

export type UaClassification = {
  uaCategory: UaCategory;
  signals: string[];
  /** Initial class from UA alone — never likely_human. */
  trafficClass: Exclude<TrafficClass, "likely_human">;
};

/**
 * Classify from User-Agent. Missing UA → unverified (not automatically bot).
 * A browser-looking UA alone never yields likely_human.
 */
export function classifyUserAgent(userAgent: string | null | undefined): UaClassification {
  const ua = typeof userAgent === "string" ? userAgent.trim() : "";
  if (!ua) {
    return { uaCategory: "unknown", signals: ["ua:missing"], trafficClass: "unverified" };
  }

  const botSignals: string[] = [];
  for (const rule of BOT_UA_RULES) {
    if (rule.pattern.test(ua)) botSignals.push(rule.code);
  }
  if (botSignals.length > 0) {
    return {
      uaCategory: "bot",
      signals: unique(botSignals).slice(0, 4),
      trafficClass: "likely_bot",
    };
  }

  const autoSignals: string[] = [];
  for (const rule of AUTOMATION_UA_RULES) {
    if (rule.pattern.test(ua)) autoSignals.push(rule.code);
  }
  if (autoSignals.length > 0) {
    return {
      uaCategory: "automation",
      signals: unique(autoSignals).slice(0, 4),
      trafficClass: "likely_bot",
    };
  }

  if (BROWSER_HINT.test(ua)) {
    return {
      uaCategory: "browser",
      signals: ["ua:browser_like"],
      trafficClass: "unverified",
    };
  }

  return {
    uaCategory: "unknown",
    signals: ["ua:unrecognized"],
    trafficClass: "unverified",
  };
}

export type EngagementEvidence = {
  maxScrollDepth: number;
  activeMs: number;
  hasInternalNav: boolean;
  hasCtaClick: boolean;
  /** Distinct engagement signal family codes already recorded. */
  signalCodes: string[];
};

/**
 * Derive independent signal families from engagement evidence.
 * Scroll or click alone is suggestive, not definitive.
 */
export function engagementSignalFamilies(evidence: EngagementEvidence): string[] {
  const out: string[] = [];
  if (evidence.maxScrollDepth >= 50) out.push("eng:scroll50");
  else if (evidence.maxScrollDepth >= 25) out.push("eng:scroll25");
  if (evidence.activeMs >= 30_000) out.push("eng:active30s");
  else if (evidence.activeMs >= 15_000) out.push("eng:active15s");
  if (evidence.hasInternalNav) out.push("eng:nav");
  if (evidence.hasCtaClick) out.push("eng:cta");
  for (const code of evidence.signalCodes) {
    if (code.startsWith("eng:") && !out.includes(code)) out.push(code);
  }
  return unique(out);
}

export type SessionClassificationInput = {
  ua: UaClassification;
  engagement: EngagementEvidence;
  /** Prior class if session already marked likely_bot — sticky. */
  priorClass?: TrafficClass | null;
  /** Age of the analytics session in ms (server-controlled). */
  sessionAgeMs?: number;
  /**
   * Time span between earliest and latest engagement/CTA events for this session.
   * Blocks single-request spoof bundles from elevating to likely_human.
   */
  engagementSpanMs?: number;
};

export type SessionClassificationResult = {
  trafficClass: TrafficClass;
  classSource: ClassSource;
  signals: string[];
  engaged: boolean;
};

/**
 * Session-level classification.
 * - Known bots stay likely_bot even if they simulate interaction.
 * - likely_human requires multiple independent engagement families, non-bot UA,
 *   minimum session age, and engagement evidence spanning multiple moments.
 * - Otherwise unverified.
 */
export function classifySession(input: SessionClassificationInput): SessionClassificationResult {
  const uaSignals = input.ua.signals;
  const engSignals = engagementSignalFamilies(input.engagement);
  const signals = unique([...uaSignals, ...engSignals]).slice(0, 12);
  const engaged = engSignals.length > 0;

  if (input.priorClass === "likely_bot" || input.ua.trafficClass === "likely_bot") {
    return {
      trafficClass: "likely_bot",
      classSource: engaged ? "combined" : "ua",
      signals,
      engaged,
    };
  }

  const sessionAgeMs = input.sessionAgeMs ?? 0;
  const engagementSpanMs = input.engagementSpanMs ?? 0;
  const timingOk =
    sessionAgeMs >= MIN_HUMAN_SESSION_AGE_MS &&
    engagementSpanMs >= MIN_HUMAN_ENGAGEMENT_SPAN_MS;

  const humanEligible =
    input.ua.uaCategory === "browser" &&
    engSignals.length >= HUMAN_SIGNAL_THRESHOLD &&
    timingOk;

  if (humanEligible) {
    return {
      trafficClass: "likely_human",
      classSource: "combined",
      signals: unique([...signals, "eng:timing_ok"]).slice(0, 12),
      engaged: true,
    };
  }

  if (engaged && engSignals.length >= HUMAN_SIGNAL_THRESHOLD && !timingOk) {
    signals.push("eng:timing_insufficient");
  }

  return {
    trafficClass: "unverified",
    classSource: engaged ? "engagement" : "ua",
    signals: unique(signals).slice(0, 12),
    engaged,
  };
}

/** Effective class for reporting: null/legacy → unverified. */
export function effectiveTrafficClass(
  value: string | null | undefined,
): TrafficClass {
  if (value === "likely_human" || value === "likely_bot" || value === "unverified") {
    return value;
  }
  return "unverified";
}

export function serializeSignals(signals: string[]): string | null {
  if (!signals.length) return null;
  return signals.slice(0, 12).join(",");
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

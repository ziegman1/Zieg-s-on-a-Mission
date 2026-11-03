import "server-only";

import { createHash } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  ANALYTICS_EVENT_TYPES,
  MAX_EVENTS_PER_REQUEST,
  MAX_EVENTS_PER_SESSION_PER_MINUTE,
  MAX_PAYLOAD_BYTES,
  PAGE_VIEW_DEDUPE_MS,
  SESSION_INACTIVITY_MS,
  SESSION_MAX_LIFETIME_MS,
  type AnalyticsEventType,
  type TrafficClass,
} from "./constants";
import {
  classifySession,
  classifyUserAgent,
  effectiveTrafficClass,
  serializeSignals,
  type EngagementEvidence,
} from "./classification";
import { shouldRecordLegacyPageView } from "./dedupe";
import { sanitizeEventMetadata } from "./metadata";
import { isMinistryFunnelPath, normalizeAnalyticsPath } from "./paths";
import { allowRateLimit } from "./rate-limit";
import { isValidSessionId } from "./session-id";

export type IngestResult = { ok: true } | { ok: false; error: string; status: number };

type IncomingEvent = {
  type?: unknown;
  path?: unknown;
  metadata?: unknown;
  referrer?: unknown;
};

function isEventType(value: unknown): value is AnalyticsEventType {
  return typeof value === "string" && (ANALYTICS_EVENT_TYPES as readonly string[]).includes(value);
}

function visitorIdFromRequest(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const ip = (forwarded?.split(",")[0]?.trim() ?? realIp ?? "").slice(0, 45);
  if (!ip) return null;
  return createHash("sha256")
    .update(ip + (process.env.ANALYTICS_SALT ?? "ziegs-merch"))
    .digest("hex")
    .slice(0, 16);
}

function truncateReferrer(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname}`.slice(0, 500);
  } catch {
    return raw.startsWith("/") ? raw.slice(0, 200) : null;
  }
}

async function ensureSession(params: {
  sessionId: string;
  path: string | null;
  uaClass: ReturnType<typeof classifyUserAgent>;
}): Promise<{
  id: string;
  trafficClass: TrafficClass;
  engaged: boolean;
  maxScrollDepth: number;
  activeMs: number;
  createdAt: Date;
}> {
  const now = new Date();
  const existing = await prisma.analyticsSession.findUnique({
    where: { id: params.sessionId },
    select: {
      id: true,
      trafficClass: true,
      engaged: true,
      maxScrollDepth: true,
      activeMs: true,
      classSignals: true,
      uaCategory: true,
      createdAt: true,
      lastSeenAt: true,
    },
  });

  if (existing) {
    const ageMs = now.getTime() - existing.createdAt.getTime();
    const idleMs = now.getTime() - existing.lastSeenAt.getTime();
    const expired =
      ageMs > SESSION_MAX_LIFETIME_MS || idleMs > SESSION_INACTIVITY_MS;

    // Sticky bot: current UA bot always wins over a prior unverified/human guess.
    const forceBot = params.uaClass.trafficClass === "likely_bot";
    const nextClass: TrafficClass = forceBot
      ? "likely_bot"
      : expired
        ? params.uaClass.trafficClass
        : effectiveTrafficClass(existing.trafficClass);

    const updated = await prisma.analyticsSession.update({
      where: { id: params.sessionId },
      data: expired
        ? {
            createdAt: now,
            lastSeenAt: now,
            trafficClass: nextClass,
            classSource: "ua",
            classSignals: serializeSignals(params.uaClass.signals),
            uaCategory: params.uaClass.uaCategory,
            engaged: false,
            maxScrollDepth: 0,
            activeMs: 0,
            landingPath: params.path ?? undefined,
          }
        : {
            lastSeenAt: now,
            ...(forceBot
              ? {
                  trafficClass: "likely_bot",
                  classSource: "ua",
                  classSignals: serializeSignals(params.uaClass.signals),
                  uaCategory: params.uaClass.uaCategory,
                }
              : {}),
          },
    });

    return {
      id: updated.id,
      trafficClass: effectiveTrafficClass(updated.trafficClass),
      engaged: updated.engaged,
      maxScrollDepth: updated.maxScrollDepth,
      activeMs: updated.activeMs,
      createdAt: updated.createdAt,
    };
  }

  const created = await prisma.analyticsSession.create({
    data: {
      id: params.sessionId,
      trafficClass: params.uaClass.trafficClass,
      classSource: "ua",
      classSignals: serializeSignals(params.uaClass.signals),
      uaCategory: params.uaClass.uaCategory,
      landingPath: params.path,
    },
  });

  return {
    id: created.id,
    trafficClass: effectiveTrafficClass(created.trafficClass),
    engaged: created.engaged,
    maxScrollDepth: created.maxScrollDepth,
    activeMs: created.activeMs,
    createdAt: created.createdAt,
  };
}

async function loadEngagementEvidence(sessionId: string): Promise<
  EngagementEvidence & { engagementSpanMs: number }
> {
  const [session, events] = await Promise.all([
    prisma.analyticsSession.findUnique({
      where: { id: sessionId },
      select: { maxScrollDepth: true, activeMs: true },
    }),
    prisma.analyticsEvent.findMany({
      where: {
        sessionId,
        eventType: {
          in: [
            "scroll_depth",
            "active_time",
            "internal_nav",
            "partner_with_us_click",
            "external_giving_link_click",
            "mission_hub_entry_click",
            "mission_hub_join_click",
            "newsletter_signup_complete",
            "contact_submission_complete",
          ],
        },
      },
      select: { eventType: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
  ]);

  const types = new Set(events.map((e) => e.eventType));
  const first = events[0]?.createdAt?.getTime();
  const last = events[events.length - 1]?.createdAt?.getTime();
  const engagementSpanMs =
    first != null && last != null && events.length >= 2 ? Math.max(0, last - first) : 0;

  return {
    maxScrollDepth: session?.maxScrollDepth ?? 0,
    activeMs: session?.activeMs ?? 0,
    hasInternalNav: types.has("internal_nav"),
    hasCtaClick: [...types].some(
      (t) =>
        t.endsWith("_click") ||
        t === "newsletter_signup_complete" ||
        t === "contact_submission_complete",
    ),
    signalCodes: [],
    engagementSpanMs,
  };
}

async function reclassifyAndPropagate(
  sessionId: string,
  ua: ReturnType<typeof classifyUserAgent>,
  sessionCreatedAt: Date,
) {
  const evidence = await loadEngagementEvidence(sessionId);
  const session = await prisma.analyticsSession.findUnique({
    where: { id: sessionId },
    select: { trafficClass: true },
  });
  const result = classifySession({
    ua,
    engagement: evidence,
    priorClass: effectiveTrafficClass(session?.trafficClass),
    sessionAgeMs: Date.now() - sessionCreatedAt.getTime(),
    engagementSpanMs: evidence.engagementSpanMs,
  });

  await prisma.analyticsSession.update({
    where: { id: sessionId },
    data: {
      trafficClass: result.trafficClass,
      classSource: result.classSource,
      classSignals: serializeSignals(result.signals),
      uaCategory: ua.uaCategory,
      engaged: result.engaged || evidence.maxScrollDepth >= 25 || evidence.activeMs >= 5_000,
      lastSeenAt: new Date(),
    },
  });

  // Reflect session classification onto page views for this session (not legacy null rows).
  await prisma.pageView.updateMany({
    where: { sessionId },
    data: {
      trafficClass: result.trafficClass,
      classSource: result.classSource,
      classSignals: serializeSignals(result.signals),
      uaCategory: ua.uaCategory,
    },
  });

  return result;
}

async function recordPageView(params: {
  path: string;
  sessionId: string;
  visitorId: string | null;
  referrer: string | null;
  ua: ReturnType<typeof classifyUserAgent>;
  trafficClass: TrafficClass;
  classSource: string;
  classSignals: string | null;
}) {
  const since = new Date(Date.now() - PAGE_VIEW_DEDUPE_MS);
  const dup = await prisma.pageView.findFirst({
    where: {
      sessionId: params.sessionId,
      path: params.path,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  if (dup) return;

  await prisma.pageView.create({
    data: {
      path: params.path,
      referrer: params.referrer,
      visitorId: params.visitorId,
      sessionId: params.sessionId,
      trafficClass: params.trafficClass,
      classSource: params.classSource,
      classSignals: params.classSignals,
      uaCategory: params.ua.uaCategory,
    },
  });
}

/**
 * Secure ingest for page views + engagement/CTA events.
 * Client-submitted trafficClass is ignored; server classifies.
 */
export async function ingestAnalyticsRequest(
  req: Request,
  body: unknown,
): Promise<IngestResult> {
  const rawSize = typeof body === "string" ? body.length : JSON.stringify(body ?? {}).length;
  if (rawSize > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: "payload_too_large", status: 413 };
  }

  const payload = (body && typeof body === "object" ? body : {}) as {
    sessionId?: unknown;
    events?: unknown;
    // Legacy single page-view shape
    path?: unknown;
  };

  if (!isValidSessionId(payload.sessionId) && typeof payload.path === "string") {
    // Legacy clients without session: still accept a solitary page view (never human).
    const path = normalizeAnalyticsPath(payload.path);
    if (!path) return { ok: true };
    const visitorId = visitorIdFromRequest(req);
    const referrer = truncateReferrer(req.headers.get("referer"));
    const ua = classifyUserAgent(req.headers.get("user-agent"));
    const visitorKey = visitorId ?? "anon";
    if (!shouldRecordLegacyPageView({ visitorKey, path })) return { ok: true };
    await prisma.pageView.create({
      data: {
        path,
        referrer,
        visitorId,
        trafficClass: ua.trafficClass,
        classSource: "ua",
        classSignals: serializeSignals(ua.signals),
        uaCategory: ua.uaCategory,
      },
    });
    return { ok: true };
  }

  if (!isValidSessionId(payload.sessionId)) {
    return { ok: false, error: "invalid_session", status: 400 };
  }

  const sessionId = payload.sessionId;
  if (!allowRateLimit(`session:${sessionId}`, MAX_EVENTS_PER_SESSION_PER_MINUTE, 60_000)) {
    return { ok: false, error: "rate_limited", status: 429 };
  }

  const ua = classifyUserAgent(req.headers.get("user-agent"));
  const visitorId = visitorIdFromRequest(req);
  const headerReferrer = truncateReferrer(req.headers.get("referer"));

  let events: IncomingEvent[] = [];
  if (Array.isArray(payload.events)) {
    events = payload.events.slice(0, MAX_EVENTS_PER_REQUEST) as IncomingEvent[];
  } else if (typeof payload.path === "string") {
    events = [{ type: "page_view", path: payload.path }];
  }

  if (!events.length) return { ok: true };

  const firstPath = normalizeAnalyticsPath(events[0]?.path) ?? null;
  const session = await ensureSession({ sessionId, path: firstPath, uaClass: ua });

  let needsReclassify = false;

  for (const event of events) {
    if (!isEventType(event.type)) continue;
    const path = normalizeAnalyticsPath(event.path);
    if (!path) continue;

    const meta = sanitizeEventMetadata(event.type, event.metadata);

    if (event.type === "page_view") {
      // PageView table is canonical; we do not also insert analytics_events type=page_view.
      const viewClass =
        ua.trafficClass === "likely_bot" ? "likely_bot" : session.trafficClass;
      await recordPageView({
        path,
        sessionId,
        visitorId,
        referrer: headerReferrer,
        ua,
        trafficClass: viewClass,
        classSource: "ua",
        classSignals: serializeSignals(ua.signals),
      });

      // Funnel page visits (derived events — not donations/conversions)
      const funnel = isMinistryFunnelPath(path);
      const derived: AnalyticsEventType[] = [];
      if (funnel.ourMission) derived.push("our_mission_view");
      if (funnel.givingPage) derived.push("giving_page_visit");
      for (const dtype of derived) {
        const recent = await prisma.analyticsEvent.findFirst({
          where: {
            sessionId,
            eventType: dtype,
            path,
            createdAt: { gte: new Date(Date.now() - 60_000) },
          },
          select: { id: true },
        });
        if (recent) continue;
        await prisma.analyticsEvent.create({
          data: {
            sessionId,
            eventType: dtype,
            path,
            trafficClass: viewClass,
          },
        });
      }
      continue;
    }

    if (event.type === "scroll_depth" && meta && typeof meta.depth === "number") {
      const nextDepth = Math.max(session.maxScrollDepth, meta.depth);
      await prisma.analyticsSession.update({
        where: { id: sessionId },
        data: {
          maxScrollDepth: nextDepth,
          lastSeenAt: new Date(),
        },
      });
      session.maxScrollDepth = nextDepth;
      needsReclassify = true;
    }

    if (event.type === "active_time" && meta && typeof meta.bucketMs === "number") {
      const nextActive = Math.max(session.activeMs, meta.bucketMs);
      await prisma.analyticsSession.update({
        where: { id: sessionId },
        data: { activeMs: nextActive, lastSeenAt: new Date() },
      });
      session.activeMs = nextActive;
      needsReclassify = true;
    }

    if (event.type === "internal_nav" || event.type.endsWith("_click")) {
      needsReclassify = true;
    }

    // Server-confirmed completions only — ignore client claims for these.
    if (
      event.type === "newsletter_signup_complete" ||
      event.type === "contact_submission_complete"
    ) {
      continue;
    }

    const data: Prisma.AnalyticsEventCreateInput = {
      session: { connect: { id: sessionId } },
      eventType: event.type,
      path,
      metadata: meta ?? undefined,
      trafficClass: session.trafficClass,
    };
    await prisma.analyticsEvent.create({ data });
  }

  if (needsReclassify) {
    await reclassifyAndPropagate(sessionId, ua, session.createdAt);
  }

  return { ok: true };
}

/**
 * Server-side confirmed conversion (newsletter/contact). No PII in metadata.
 */
export async function recordConfirmedAnalyticsEvent(params: {
  sessionId: string | null | undefined;
  eventType: "newsletter_signup_complete" | "contact_submission_complete";
  path: string;
  /** Optional request UA — if bot, do not elevate to likely_human. */
  userAgent?: string | null;
}): Promise<void> {
  if (!isValidSessionId(params.sessionId)) return;
  const path = normalizeAnalyticsPath(params.path);
  if (!path) return;
  const ua = classifyUserAgent(params.userAgent);
  const nextClass: TrafficClass =
    ua.trafficClass === "likely_bot" ? "likely_bot" : "likely_human";
  try {
    const existing = await prisma.analyticsSession.findUnique({
      where: { id: params.sessionId },
      select: { trafficClass: true },
    });
    const stickyBot =
      effectiveTrafficClass(existing?.trafficClass) === "likely_bot" ||
      nextClass === "likely_bot";
    const trafficClass: TrafficClass = stickyBot ? "likely_bot" : "likely_human";
    await prisma.analyticsEvent.create({
      data: {
        sessionId: params.sessionId,
        eventType: params.eventType,
        path,
        trafficClass,
        metadata: { cta: "server_confirmed" },
      },
    });
    await prisma.analyticsSession.update({
      where: { id: params.sessionId },
      data: {
        trafficClass,
        classSource: stickyBot ? "ua" : "combined",
        engaged: true,
        lastSeenAt: new Date(),
      },
    });
  } catch {
    // Soft fail
  }
}

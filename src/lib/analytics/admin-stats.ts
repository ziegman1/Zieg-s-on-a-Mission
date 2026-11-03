import "server-only";

import { prisma } from "@/lib/db";
import { effectiveTrafficClass } from "./classification";
import { resolveCutoffDisplay, type CutoffResolution } from "./cutoff";
import {
  pageViewClassWhere,
  sessionClassWhere,
  type StatsRangeDays,
  type StatsTrafficFilter,
} from "./admin-stats-filters";

export type { StatsRangeDays, StatsTrafficFilter };
export {
  parseStatsRange,
  parseTrafficFilter,
  pageViewClassWhere,
  sessionClassWhere,
} from "./admin-stats-filters";

async function loadDailyPageViews(
  since: Date,
  filter: StatsTrafficFilter,
): Promise<{ date: Date; cnt: bigint }[]> {
  if (filter === "all") {
    return prisma.$queryRaw<{ date: Date; cnt: bigint }[]>`
      SELECT date_trunc('day', "createdAt")::date AS date, COUNT(*)::bigint AS cnt
      FROM "PageView"
      WHERE "createdAt" >= ${since}
      GROUP BY date_trunc('day', "createdAt")::date
      ORDER BY date ASC
    `;
  }
  if (filter === "unverified") {
    return prisma.$queryRaw<{ date: Date; cnt: bigint }[]>`
      SELECT date_trunc('day', "createdAt")::date AS date, COUNT(*)::bigint AS cnt
      FROM "PageView"
      WHERE "createdAt" >= ${since}
        AND ("trafficClass" IS NULL OR "trafficClass" = 'unverified')
      GROUP BY date_trunc('day', "createdAt")::date
      ORDER BY date ASC
    `;
  }
  return prisma.$queryRaw<{ date: Date; cnt: bigint }[]>`
    SELECT date_trunc('day', "createdAt")::date AS date, COUNT(*)::bigint AS cnt
    FROM "PageView"
    WHERE "createdAt" >= ${since}
      AND "trafficClass" = ${filter}
    GROUP BY date_trunc('day', "createdAt")::date
    ORDER BY date ASC
  `;
}

export type AdminStatsBundle = {
  rangeDays: StatsRangeDays;
  trafficFilter: StatsTrafficFilter;
  since: Date;
  cutoffIso: string;
  cutoffSource: CutoffResolution["source"];
  cutoffProvisional: boolean;
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  engagedSessions: number;
  byDay: { date: string; views: number }[];
  topPaths: { path: string; views: number }[];
  scrollSummary: { depth: number; events: number }[];
  activeTimeSummary: { bucketMs: number; events: number }[];
  journeys: { path: string; sessions: number }[];
  funnel: {
    our_mission_view: number;
    partner_with_us_click: number;
    giving_page_visit: number;
    external_giving_link_click: number;
    mission_hub_entry_click: number;
    mission_hub_join_click: number;
    newsletter_signup_complete: number;
    contact_submission_complete: number;
  };
  classBreakdown: { likely_human: number; unverified: number; likely_bot: number };
};

export async function loadAdminStats(params: {
  rangeDays: StatsRangeDays;
  trafficFilter: StatsTrafficFilter;
}): Promise<AdminStatsBundle> {
  const since = new Date();
  since.setDate(since.getDate() - params.rangeDays);

  const pvClass = pageViewClassWhere(params.trafficFilter);
  const sessClass = sessionClassWhere(params.trafficFilter);
  const pvWhere = {
    createdAt: { gte: since },
    ...(pvClass ?? {}),
  };
  const sessWhere = {
    createdAt: { gte: since },
    ...(sessClass ?? {}),
  };

  const emptyFunnel = {
    our_mission_view: 0,
    partner_with_us_click: 0,
    giving_page_visit: 0,
    external_giving_link_click: 0,
    mission_hub_entry_click: 0,
    mission_hub_join_click: 0,
    newsletter_signup_complete: 0,
    contact_submission_complete: 0,
  };

  try {
    const [
      pageViews,
      visitorGroups,
      sessions,
      engagedSessions,
      paths,
      daily,
      activeEvents,
      journeyGroups,
      funnelEvents,
      allClassCounts,
      firstClassified,
    ] = await Promise.all([
      prisma.pageView.count({ where: pvWhere }),
      prisma.pageView.groupBy({
        by: ["visitorId"],
        where: { ...pvWhere, visitorId: { not: null } },
      }),
      prisma.analyticsSession.count({ where: sessWhere }),
      prisma.analyticsSession.count({ where: { ...sessWhere, engaged: true } }),
      prisma.pageView.groupBy({
        by: ["path"],
        where: pvWhere,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      loadDailyPageViews(since, params.trafficFilter),
      prisma.analyticsEvent.findMany({
        where: {
          createdAt: { gte: since },
          eventType: "active_time",
          ...(params.trafficFilter === "all"
            ? {}
            : params.trafficFilter === "unverified"
              ? { OR: [{ trafficClass: null }, { trafficClass: "unverified" }] }
              : { trafficClass: params.trafficFilter }),
        },
        select: { metadata: true },
        take: 5_000,
      }),
      prisma.analyticsSession.groupBy({
        by: ["landingPath"],
        where: { ...sessWhere, landingPath: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 8,
      }),
      prisma.analyticsEvent.groupBy({
        by: ["eventType"],
        where: {
          createdAt: { gte: since },
          eventType: {
            in: Object.keys(emptyFunnel),
          },
          ...(params.trafficFilter === "all"
            ? {}
            : params.trafficFilter === "unverified"
              ? { OR: [{ trafficClass: null }, { trafficClass: "unverified" }] }
              : { trafficClass: params.trafficFilter }),
        },
        _count: { id: true },
      }),
      prisma.pageView.groupBy({
        by: ["trafficClass"],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
      prisma.pageView.findFirst({
        where: { trafficClass: { not: null } },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
    ]);

    const cutoff = resolveCutoffDisplay({
      firstClassifiedAt: firstClassified?.createdAt ?? null,
    });

    const viewsByDay = Object.fromEntries(
      (Array.isArray(daily) ? daily : []).map((r) => {
        const n = Number(r?.cnt ?? 0);
        return [r?.date?.toISOString?.()?.slice(0, 10) ?? "", n];
      }).filter(([k]) => k),
    );

    const byDay: { date: string; views: number }[] = [];
    for (let i = params.rangeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      byDay.push({ date: key, views: viewsByDay[key] ?? 0 });
    }

    const scrollMap = new Map<number, number>();
    // Prefer counting from findMany-style; groupBy on Json is unreliable — recount via query
    const scrollRows = await prisma.analyticsEvent.findMany({
      where: {
        createdAt: { gte: since },
        eventType: "scroll_depth",
        ...(params.trafficFilter === "all"
          ? {}
          : params.trafficFilter === "unverified"
            ? { OR: [{ trafficClass: null }, { trafficClass: "unverified" }] }
            : { trafficClass: params.trafficFilter }),
      },
      select: { metadata: true },
      take: 5_000,
    });
    for (const row of scrollRows) {
      const depth =
        row.metadata &&
        typeof row.metadata === "object" &&
        !Array.isArray(row.metadata) &&
        typeof (row.metadata as { depth?: unknown }).depth === "number"
          ? (row.metadata as { depth: number }).depth
          : null;
      if (depth == null) continue;
      scrollMap.set(depth, (scrollMap.get(depth) ?? 0) + 1);
    }
    const activeMap = new Map<number, number>();
    for (const row of activeEvents) {
      const bucket =
        row.metadata &&
        typeof row.metadata === "object" &&
        !Array.isArray(row.metadata) &&
        typeof (row.metadata as { bucketMs?: unknown }).bucketMs === "number"
          ? (row.metadata as { bucketMs: number }).bucketMs
          : null;
      if (bucket == null) continue;
      activeMap.set(bucket, (activeMap.get(bucket) ?? 0) + 1);
    }

    const funnel = { ...emptyFunnel };
    for (const row of funnelEvents) {
      if (row.eventType in funnel) {
        funnel[row.eventType as keyof typeof funnel] = row._count.id;
      }
    }

    const classBreakdown = { likely_human: 0, unverified: 0, likely_bot: 0 };
    for (const row of allClassCounts) {
      const cls = effectiveTrafficClass(row.trafficClass);
      classBreakdown[cls] += row._count.id;
    }

    return {
      rangeDays: params.rangeDays,
      trafficFilter: params.trafficFilter,
      since,
      cutoffIso: cutoff.iso,
      cutoffSource: cutoff.source,
      cutoffProvisional: cutoff.provisional,
      pageViews,
      uniqueVisitors: visitorGroups.length,
      sessions,
      engagedSessions,
      byDay,
      topPaths: paths.map((p) => ({ path: p.path, views: p._count.id })),
      scrollSummary: [...scrollMap.entries()]
        .map(([depth, events]) => ({ depth, events }))
        .sort((a, b) => a.depth - b.depth),
      activeTimeSummary: [...activeMap.entries()]
        .map(([bucketMs, events]) => ({ bucketMs, events }))
        .sort((a, b) => a.bucketMs - b.bucketMs),
      journeys: journeyGroups
        .filter((j) => j.landingPath)
        .map((j) => ({ path: j.landingPath!, sessions: j._count.id })),
      funnel,
      classBreakdown,
    };
  } catch (e) {
    console.error("[loadAdminStats]", e);
    const byDay: { date: string; views: number }[] = [];
    for (let i = params.rangeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      byDay.push({ date: d.toISOString().slice(0, 10), views: 0 });
    }
    const cutoff = resolveCutoffDisplay({});
    return {
      rangeDays: params.rangeDays,
      trafficFilter: params.trafficFilter,
      since,
      cutoffIso: cutoff.iso,
      cutoffSource: cutoff.source,
      cutoffProvisional: cutoff.provisional,
      pageViews: 0,
      uniqueVisitors: 0,
      sessions: 0,
      engagedSessions: 0,
      byDay,
      topPaths: [],
      scrollSummary: [],
      activeTimeSummary: [],
      journeys: [],
      funnel: emptyFunnel,
      classBreakdown: { likely_human: 0, unverified: 0, likely_bot: 0 },
    };
  }
}

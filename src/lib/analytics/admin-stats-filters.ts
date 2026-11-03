import type { TrafficClass } from "./constants";

export type StatsRangeDays = 7 | 30 | 90;
export type StatsTrafficFilter = TrafficClass | "all";

export function parseStatsRange(raw: string | undefined): StatsRangeDays {
  if (raw === "7" || raw === "90") return Number(raw) as StatsRangeDays;
  return 30;
}

export function parseTrafficFilter(raw: string | undefined): StatsTrafficFilter {
  if (raw === "likely_human" || raw === "likely_bot" || raw === "unverified" || raw === "all") {
    return raw;
  }
  return "likely_human";
}

/** Prisma where fragment for PageView.trafficClass given filter. */
export function pageViewClassWhere(filter: StatsTrafficFilter): Record<string, unknown> | undefined {
  if (filter === "all") return undefined;
  if (filter === "unverified") {
    return {
      OR: [{ trafficClass: null }, { trafficClass: "unverified" }],
    };
  }
  return { trafficClass: filter };
}

export function sessionClassWhere(filter: StatsTrafficFilter): Record<string, unknown> | undefined {
  if (filter === "all") return undefined;
  if (filter === "unverified") {
    return {
      OR: [{ trafficClass: "unverified" }],
    };
  }
  return { trafficClass: filter };
}

import { SITE_TIMEZONE, startOfSiteDay } from "@/lib/community/site-timezone";
import { contentStr } from "./content-utils";

const SECONDS_PER_DAY = 86_400;

export type MissionCounterConfig = {
  worldPopulationBaseline: number;
  worldPopulationBaselineAtMs: number;
  worldPopulationPerSecond: number;
  bornWithoutAccessPerDay: number;
  dieWithoutAccessPerDay: number;
};

export type MissionCounterValues = {
  worldPopulation: number;
  bornTodayWithoutAccess: number;
  diedTodayWithoutAccess: number;
};

export function parsePositiveNumber(value: string, fallback: number): number {
  const trimmed = value.trim().replace(/,/g, "");
  if (!trimmed) return fallback;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

export function parseBaselineTimestamp(value: string, fallbackMs: number): number {
  const trimmed = value.trim();
  if (!trimmed) return fallbackMs;
  const parsed = Date.parse(trimmed);
  if (!Number.isFinite(parsed)) return fallbackMs;
  return parsed;
}

export function parseMissionCounterConfig(
  content: Record<string, unknown>,
  defaults: MissionCounterConfig,
): MissionCounterConfig {
  return {
    worldPopulationBaseline: parsePositiveNumber(
      contentStr(content, "worldPopulationBaseline"),
      defaults.worldPopulationBaseline,
    ),
    worldPopulationBaselineAtMs: parseBaselineTimestamp(
      contentStr(content, "worldPopulationBaselineAt"),
      defaults.worldPopulationBaselineAtMs,
    ),
    worldPopulationPerSecond: parsePositiveNumber(
      contentStr(content, "worldPopulationPerSecond"),
      defaults.worldPopulationPerSecond,
    ),
    bornWithoutAccessPerDay: parsePositiveNumber(
      contentStr(content, "bornWithoutAccessPerDay"),
      defaults.bornWithoutAccessPerDay,
    ),
    dieWithoutAccessPerDay: parsePositiveNumber(
      contentStr(content, "dieWithoutAccessPerDay"),
      defaults.dieWithoutAccessPerDay,
    ),
  };
}

export function defaultMissionCounterConfig(): MissionCounterConfig {
  return parseMissionCounterConfig(
    {
      worldPopulationBaseline: "8100000000",
      worldPopulationBaselineAt: "2025-01-01T12:00:00.000Z",
      worldPopulationPerSecond: "2.3",
      bornWithoutAccessPerDay: "150000",
      dieWithoutAccessPerDay: "70000",
    },
    {
      worldPopulationBaseline: 8_100_000_000,
      worldPopulationBaselineAtMs: Date.parse("2025-01-01T12:00:00.000Z"),
      worldPopulationPerSecond: 2.3,
      bornWithoutAccessPerDay: 150_000,
      dieWithoutAccessPerDay: 70_000,
    },
  );
}

export function computeMissionCounterValues(
  nowMs: number,
  config: MissionCounterConfig,
  timezone = SITE_TIMEZONE,
): MissionCounterValues {
  const elapsedSeconds = Math.max(0, (nowMs - config.worldPopulationBaselineAtMs) / 1000);
  const worldPopulation =
    config.worldPopulationBaseline + elapsedSeconds * config.worldPopulationPerSecond;

  const dayStartMs = startOfSiteDay(nowMs).getTime();
  const secondsToday = Math.max(0, (nowMs - dayStartMs) / 1000);

  const bornTodayWithoutAccess =
    (secondsToday / SECONDS_PER_DAY) * config.bornWithoutAccessPerDay;
  const diedTodayWithoutAccess =
    (secondsToday / SECONDS_PER_DAY) * config.dieWithoutAccessPerDay;

  return {
    worldPopulation,
    bornTodayWithoutAccess,
    diedTodayWithoutAccess,
  };
}

export function formatCounterValue(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
    Math.floor(value),
  );
}

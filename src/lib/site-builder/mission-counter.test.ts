import { describe, expect, it } from "vitest";
import { DEFAULT_MISSION_COUNTER_CONTENT } from "@/data/mission-counter-defaults";
import { defaultSectionsForPage } from "./defaults";
import {
  homeNeedsMissionCounterMigration,
  insertHomeMissionCounterAfterHero,
} from "./home-mission-counter-migration";
import {
  computeMissionCounterValues,
  defaultMissionCounterConfig,
  formatCounterValue,
  parseBaselineTimestamp,
  parseMissionCounterConfig,
  parsePositiveNumber,
} from "./mission-counter";
import { SECTION_REGISTRY } from "./registry";
import { zonedTimeToUtc } from "@/lib/community/site-timezone";

describe("mission_counter registry", () => {
  it("is registered with required fields", () => {
    const reg = SECTION_REGISTRY.mission_counter;
    expect(reg.type).toBe("mission_counter");
    const keys = reg.fields.map((f) => f.key);
    expect(keys).toContain("headline");
    expect(keys).toContain("body");
    expect(keys).toContain("worldPopulationBaseline");
    expect(keys).toContain("worldPopulationBaselineAt");
    expect(keys).toContain("worldPopulationPerSecond");
    expect(keys).toContain("bornWithoutAccessPerDay");
    expect(keys).toContain("dieWithoutAccessPerDay");
    expect(keys).toContain("sourceNote");
    expect(keys).toContain("sourceUrl");
  });
});

describe("default home sections", () => {
  it("includes mission_counter immediately after hero", () => {
    const sections = defaultSectionsForPage("home");
    expect(sections[0]?.sectionKey).toBe("hero");
    expect(sections[1]?.sectionType).toBe("mission_counter");
    expect(sections[1]?.sectionKey).toBe("mission-counter");
    expect(String(sections[1]?.content.headline ?? "")).toBe(
      DEFAULT_MISSION_COUNTER_CONTENT.headline,
    );
  });
});

describe("insertHomeMissionCounterAfterHero", () => {
  it("inserts mission_counter after hero without removing existing sections", () => {
    const saved = defaultSectionsForPage("home").filter((s) => s.sectionKey !== "mission-counter");
    expect(homeNeedsMissionCounterMigration(saved)).toBe(true);

    const { sections, changed } = insertHomeMissionCounterAfterHero(saved);
    expect(changed).toBe(true);
    expect(sections[0]?.sectionKey).toBe("hero");
    expect(sections[1]?.sectionType).toBe("mission_counter");
    expect(sections[1]?.sectionKey).toBe("mission-counter");
    expect(sections[2]?.sectionKey).toBe("guided-about");
    expect(sections.length).toBe(saved.length + 1);
  });

  it("is a no-op when mission_counter already exists", () => {
    const defaults = defaultSectionsForPage("home");
    expect(homeNeedsMissionCounterMigration(defaults)).toBe(false);
    const result = insertHomeMissionCounterAfterHero(defaults);
    expect(result.changed).toBe(false);
  });
});

describe("parsePositiveNumber", () => {
  it("parses plain and comma-separated numbers", () => {
    expect(parsePositiveNumber("8100000000", 0)).toBe(8_100_000_000);
    expect(parsePositiveNumber("8,100,000,000", 0)).toBe(8_100_000_000);
  });

  it("falls back on invalid values", () => {
    expect(parsePositiveNumber("", 42)).toBe(42);
    expect(parsePositiveNumber("not-a-number", 42)).toBe(42);
    expect(parsePositiveNumber("-5", 42)).toBe(42);
  });
});

describe("parseBaselineTimestamp", () => {
  it("parses ISO timestamps and falls back safely", () => {
    const ms = Date.parse("2025-01-01T12:00:00.000Z");
    expect(parseBaselineTimestamp("2025-01-01T12:00:00.000Z", 0)).toBe(ms);
    expect(parseBaselineTimestamp("invalid", 99)).toBe(99);
  });
});

describe("computeMissionCounterValues", () => {
  const config = {
    worldPopulationBaseline: 8_100_000_000,
    worldPopulationBaselineAtMs: Date.parse("2025-01-01T12:00:00.000Z"),
    worldPopulationPerSecond: 2,
    bornWithoutAccessPerDay: 86_400,
    dieWithoutAccessPerDay: 43_200,
  };

  it("projects world population from baseline and per-second growth", () => {
    const atBaseline = computeMissionCounterValues(config.worldPopulationBaselineAtMs, config);
    expect(atBaseline.worldPopulation).toBe(8_100_000_000);

    const tenSecondsLater = computeMissionCounterValues(
      config.worldPopulationBaselineAtMs + 10_000,
      config,
    );
    expect(tenSecondsLater.worldPopulation).toBe(8_100_000_020);
  });

  it("computes today counters from per-day rates", () => {
    const dayStart = zonedTimeToUtc(2025, 6, 7, 0, 0, 0, "America/Chicago");
    const noon = dayStart.getTime() + 43_200_000;

    const values = computeMissionCounterValues(noon, config, "America/Chicago");
    expect(values.bornTodayWithoutAccess).toBeCloseTo(43_200, 0);
    expect(values.diedTodayWithoutAccess).toBeCloseTo(21_600, 0);
  });
});

describe("parseMissionCounterConfig", () => {
  it("uses defaults when content is missing or invalid", () => {
    const defaults = defaultMissionCounterConfig();
    const parsed = parseMissionCounterConfig(
      {
        worldPopulationBaseline: "bad",
        worldPopulationPerSecond: "",
        bornWithoutAccessPerDay: "-1",
      },
      defaults,
    );
    expect(parsed.worldPopulationBaseline).toBe(defaults.worldPopulationBaseline);
    expect(parsed.worldPopulationPerSecond).toBe(defaults.worldPopulationPerSecond);
    expect(parsed.bornWithoutAccessPerDay).toBe(defaults.bornWithoutAccessPerDay);
  });
});

describe("formatCounterValue", () => {
  it("formats whole numbers with grouping", () => {
    expect(formatCounterValue(8_100_000_123.9)).toBe("8,100,000,123");
  });
});

import { describe, expect, it } from "vitest";
import { SITE_TIMEZONE, startOfSiteDay, zonedTimeToUtc } from "./site-timezone";

describe("site timezone", () => {
  it("startOfSiteDay uses America/Chicago midnight boundary", () => {
    // 2026-06-16 01:30 UTC = 2026-06-15 20:30 CDT — still "yesterday" in Chicago
    const duringChicagoEvening = Date.parse("2026-06-16T01:30:00.000Z");
    const start = startOfSiteDay(duringChicagoEvening);
    expect(start.toISOString()).toBe("2026-06-15T05:00:00.000Z");

    // 2026-06-16 06:00 UTC = 2026-06-16 01:00 CDT — new Chicago day
    const afterChicagoMidnight = Date.parse("2026-06-16T06:00:00.000Z");
    const nextStart = startOfSiteDay(afterChicagoMidnight);
    expect(nextStart.toISOString()).toBe("2026-06-16T05:00:00.000Z");
  });

  it("zonedTimeToUtc respects Chicago DST offset", () => {
    const winter = zonedTimeToUtc(2026, 1, 15, 0, 0, 0, SITE_TIMEZONE);
    expect(winter.toISOString()).toBe("2026-01-15T06:00:00.000Z");

    const summer = zonedTimeToUtc(2026, 6, 15, 0, 0, 0, SITE_TIMEZONE);
    expect(summer.toISOString()).toBe("2026-06-15T05:00:00.000Z");
  });
});

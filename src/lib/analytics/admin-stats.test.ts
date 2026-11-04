import { describe, expect, it } from "vitest";
import {
  pageViewClassWhere,
  parseStatsRange,
  parseTrafficFilter,
} from "./admin-stats-filters";
import { resolveCutoffDisplay } from "./cutoff";

describe("admin stats filters", () => {
  it("defaults to all traffic and 30 days", () => {
    expect(parseTrafficFilter(undefined)).toBe("all");
    expect(parseTrafficFilter("")).toBe("all");
    expect(parseTrafficFilter("bogus")).toBe("all");
    expect(parseTrafficFilter("likely_human")).toBe("likely_human");
    expect(parseTrafficFilter("unverified")).toBe("unverified");
    expect(parseTrafficFilter("likely_bot")).toBe("likely_bot");
    expect(parseTrafficFilter("all")).toBe("all");
    expect(parseStatsRange(undefined)).toBe(30);
    expect(parseStatsRange("7")).toBe(7);
    expect(parseStatsRange("90")).toBe(90);
  });

  it("maps unverified filter to null or unverified trafficClass", () => {
    expect(pageViewClassWhere("unverified")).toEqual({
      OR: [{ trafficClass: null }, { trafficClass: "unverified" }],
    });
    expect(pageViewClassWhere("likely_human")).toEqual({ trafficClass: "likely_human" });
    expect(pageViewClassWhere("all")).toBeUndefined();
  });

  it("resolves cutoff from env or first classified row, not hardcoded midnight alone", () => {
    const fromEnv = resolveCutoffDisplay({
      envIso: "2026-11-03T15:42:00.000Z",
      firstClassifiedAt: null,
    });
    expect(fromEnv.source).toBe("env");
    expect(fromEnv.provisional).toBe(false);
    expect(fromEnv.iso).toBe("2026-11-03T15:42:00.000Z");

    const fromRow = resolveCutoffDisplay({
      envIso: null,
      firstClassifiedAt: new Date("2026-11-03T18:05:12.000Z"),
    });
    expect(fromRow.source).toBe("first_classified_row");
    expect(fromRow.provisional).toBe(false);

    const pending = resolveCutoffDisplay({ envIso: null, firstClassifiedAt: null });
    expect(pending.provisional).toBe(true);
    expect(pending.source).toBe("pending_fallback");
  });
});

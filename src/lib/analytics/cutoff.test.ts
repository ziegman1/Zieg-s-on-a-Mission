import { describe, expect, it } from "vitest";
import { parseCutoffIso, resolveConfiguredCutoffIso, resolveCutoffDisplay } from "./cutoff";

describe("analytics cutoff", () => {
  it("parses valid ISO timestamps", () => {
    expect(parseCutoffIso("2026-11-03T15:42:11.000Z")).toBe("2026-11-03T15:42:11.000Z");
    expect(parseCutoffIso("not-a-date")).toBeNull();
  });

  it("prefers env over first classified row", () => {
    const r = resolveCutoffDisplay({
      envIso: "2026-11-04T12:00:00.000Z",
      firstClassifiedAt: new Date("2026-11-03T18:00:00.000Z"),
    });
    expect(r.source).toBe("env");
    expect(r.iso).toBe("2026-11-04T12:00:00.000Z");
  });

  it("reads configured env helper", () => {
    expect(resolveConfiguredCutoffIso("2026-11-03T16:01:00.000Z")).toBe(
      "2026-11-03T16:01:00.000Z",
    );
    expect(resolveConfiguredCutoffIso("")).toBeNull();
  });
});

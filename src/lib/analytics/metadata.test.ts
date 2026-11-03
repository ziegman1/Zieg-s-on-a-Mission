import { describe, expect, it } from "vitest";
import { sanitizeEventMetadata } from "./metadata";

describe("sanitizeEventMetadata", () => {
  it("allowlists scroll depth and rejects arbitrary keys", () => {
    expect(
      sanitizeEventMetadata("scroll_depth", { depth: 50, email: "x@y.com", trafficClass: "likely_human" }),
    ).toEqual({ depth: 50 });
  });

  it("rejects spoofed active durations outside buckets", () => {
    expect(sanitizeEventMetadata("active_time", { bucketMs: 99999 })).toBeNull();
    expect(sanitizeEventMetadata("active_time", { bucketMs: 15_000 })).toEqual({ bucketMs: 15_000 });
  });

  it("ignores client-claimed human classification fields", () => {
    const meta = sanitizeEventMetadata("partner_with_us_click", {
      cta: "partner_with_us_click",
      trafficClass: "likely_human",
      name: "Jeremy",
    });
    expect(meta).toEqual({ cta: "partner_with_us_click" });
    expect(meta).not.toHaveProperty("trafficClass");
    expect(meta).not.toHaveProperty("name");
  });
});

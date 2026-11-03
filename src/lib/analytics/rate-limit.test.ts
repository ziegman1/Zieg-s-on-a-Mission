import { describe, expect, it } from "vitest";
import { allowRateLimit, resetRateLimitsForTests } from "./rate-limit";

describe("allowRateLimit", () => {
  it("throttles after limit within window", () => {
    resetRateLimitsForTests();
    expect(allowRateLimit("t1", 2, 60_000, 1000)).toBe(true);
    expect(allowRateLimit("t1", 2, 60_000, 1001)).toBe(true);
    expect(allowRateLimit("t1", 2, 60_000, 1002)).toBe(false);
    expect(allowRateLimit("t1", 2, 60_000, 70_000)).toBe(true);
  });
});

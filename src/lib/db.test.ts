import { describe, expect, it } from "vitest";
import { getPrismaClient } from "./db";

describe("prisma singleton", () => {
  it("returns the same client instance across calls", () => {
    const a = getPrismaClient();
    const b = getPrismaClient();
    expect(a).toBe(b);
  });
});

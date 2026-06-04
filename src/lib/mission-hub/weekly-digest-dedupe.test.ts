import { describe, expect, it } from "vitest";
import {
  weeklyDigestEmailDedupeKey,
  weeklyDigestTestEmailDedupeKey,
  weeklyDigestWeekKey,
} from "@/lib/mission-hub/email-dedupe";

describe("weekly digest dedupe keys", () => {
  const ref = new Date("2026-05-20T12:00:00.000Z");

  it("uses ISO week in member dedupe key", () => {
    expect(weeklyDigestWeekKey(ref)).toBe("2026-W21");
    expect(weeklyDigestEmailDedupeKey(ref)).toBe("weekly-digest:2026-W21:email");
  });

  it("uses separate test dedupe key per admin user", () => {
    expect(weeklyDigestTestEmailDedupeKey(ref, "admin-1")).toBe(
      "weekly-digest:2026-W21:test:admin-1",
    );
    expect(weeklyDigestTestEmailDedupeKey(ref, "admin-2")).not.toBe(
      weeklyDigestTestEmailDedupeKey(ref, "admin-1"),
    );
  });
});

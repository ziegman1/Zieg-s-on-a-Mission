import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MINISTRY_FUNDING_FUNCTIONS,
  MINISTRY_FUNDING_HERO,
  MINISTRY_FUNDING_INVITATION,
  MINISTRY_FUNDING_TRANSFER_SCHEMA_VERSION,
  MISSION_SHARE_CATEGORY,
} from "./ministry-funding-content";

describe("ministry funding content defaults", () => {
  it("uses the approved hero and invitation copy", () => {
    expect(MINISTRY_FUNDING_HERO.title).toBe("FUELING THE MISSION.");
    expect(MINISTRY_FUNDING_HERO.supporting).toBe("Investing in Workers. Advancing the Gospel.");
    expect(MINISTRY_FUNDING_INVITATION.primaryCtaUrl).toBe("/give");
    expect(MINISTRY_FUNDING_INVITATION.title).toContain("YOUR PARTNERSHIP");
  });

  it("includes the seven PD starter ministry functions", () => {
    expect(MINISTRY_FUNDING_FUNCTIONS.map((f) => f.name)).toEqual([
      "Mobilization",
      "Training & Equipping",
      "Coaching & Development",
      "Leadership Development & Education",
      "Disciple-Making & Church Multiplication",
      "Partnership Development & Support Raising",
      "Ministry Operations & Stewardship",
    ]);
  });

  it("keeps Mission Share as a separate reporting category", () => {
    expect(MISSION_SHARE_CATEGORY.name).toBe("Team Expansion Mission Share");
    expect(MINISTRY_FUNDING_TRANSFER_SCHEMA_VERSION).toBe("1.0.0");
  });

  it("does not hardcode verified funding figures in defaults", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/data/ministry-funding-content.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/monthlyGoal:\s*\d/);
    expect(source).not.toMatch(/\$\d{2,}/);
  });
});

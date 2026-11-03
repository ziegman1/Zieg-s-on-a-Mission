import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MINISTRY_FUNDING_CHART,
  MINISTRY_FUNDING_FUNCTIONS,
  MINISTRY_FUNDING_FUNCTIONS_HEADING,
  MINISTRY_FUNDING_FUNCTIONS_INTRO,
  MINISTRY_FUNDING_HERO,
  MINISTRY_FUNDING_INVITATION,
  MINISTRY_FUNDING_PARTNER_CTA,
  MINISTRY_FUNDING_TRANSFER_SCHEMA_VERSION,
  MISSION_SHARE_CATEGORY,
} from "./ministry-funding-content";

describe("ministry funding content defaults", () => {
  it("uses the approved hero and invitation copy", () => {
    expect(MINISTRY_FUNDING_HERO.title).toBe("FUELING THE MISSION.");
    expect(MINISTRY_FUNDING_HERO.supporting).toBe("Investing in Workers. Advancing the Gospel.");
    expect(MINISTRY_FUNDING_PARTNER_CTA).toEqual({
      label: "Partner With Us",
      url: "https://mission-multiplied.raiselysite.com/jeremy-ziegenhorn",
    });
    const fundingUi = readFileSync(
      resolve(process.cwd(), "src/components/ministry-funding/ministry-funding-editable-sections.tsx"),
      "utf8",
    );
    expect(fundingUi).toContain("MinistryFundingAboveFoldEditable");
    expect(fundingUi).toContain("StorefrontIntroViewport");
    expect(fundingUi).toContain("PartnerWithUsCta");
    expect(MINISTRY_FUNDING_INVITATION.primaryCtaUrl).toBe(
      "https://mission-multiplied.raiselysite.com/jeremy-ziegenhorn",
    );
    expect(MINISTRY_FUNDING_INVITATION.title).toContain("YOUR PARTNERSHIP");
    expect(MINISTRY_FUNDING_INVITATION.body).toBe(
      "Together, we're mobilizing, training, and sending 300 more workers by August 31, 2031, for the sake of reaching the unreached.",
    );
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

  it("keeps a single primary functions heading with supporting intro and chart label", () => {
    expect(MINISTRY_FUNDING_FUNCTIONS_HEADING).toBe(
      "How Your Partnership Supports the Mission",
    );
    expect(MINISTRY_FUNDING_FUNCTIONS_INTRO).toContain("seven areas of ministry");
    expect(MINISTRY_FUNDING_CHART.title).toBe("Estimated Ministry Investment by Function");
  });

  it("keeps Mission Share as a source reporting category folded into Operations on the chart", () => {
    expect(MISSION_SHARE_CATEGORY.name).toBe("Team Expansion Mission Share");
    expect(MISSION_SHARE_CATEGORY.description).toMatch(/Ministry Operations & Stewardship/);
    expect(MINISTRY_FUNDING_TRANSFER_SCHEMA_VERSION).toBe("zoam-ministry-allocation/v1");
    expect(MINISTRY_FUNDING_CHART.explanation).toBe(
      "This chart illustrates how ministry expenses support our seven areas of service. Direct expenses are assigned to their respective functions, while shared expenses are allocated according to recorded ministry time. Team Expansion Mission Share is included in Ministry Operations & Stewardship.",
    );
    expect(MINISTRY_FUNDING_CHART.distinction).toBe("");
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

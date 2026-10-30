import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import {
  formatNationalPartnerInitiativeAudit,
  formatNationalPartnerInitiativeErrors,
  nationalPartnerInitiativeCreateSchema,
  nationalPartnerInitiativeSchema,
} from "./national-partner-initiatives";

const valid = {
  nation: "Kenya",
  area: "Rift Valley",
  trainingType: "JONATHAN_TRAINING",
  completedCount: "40",
};

describe("national partner initiative input", () => {
  it("accepts the three training types and keeps the completed count", () => {
    for (const trainingType of ["JONATHAN_TRAINING", "FOUR_FIELDS", "MEDICAL_TRAINING"]) {
      const parsed = nationalPartnerInitiativeSchema.safeParse({ ...valid, trainingType });
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;
      expect(parsed.data.trainingType).toBe(trainingType);
      expect(parsed.data.completedCount).toBe(40);
      expect(parsed.data.nation).toBe("Kenya");
      expect(parsed.data.area).toBe("Rift Valley");
    }
  });

  it("rejects other programs, empty fields, and counts that are not a positive whole number", () => {
    const online = nationalPartnerInitiativeSchema.safeParse({
      ...valid,
      trainingType: "FOUR_FIELDS_ONLINE",
    });
    expect(online.success).toBe(false);
    if (!online.success) {
      expect(formatNationalPartnerInitiativeErrors(online.error)).toContain("Training type");
      expect(formatNationalPartnerInitiativeErrors(online.error)).toContain("Four Fields");
    }

    for (const completedCount of ["", "0", "-3", "40.5", "40abc"]) {
      const parsed = nationalPartnerInitiativeSchema.safeParse({ ...valid, completedCount });
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(formatNationalPartnerInitiativeErrors(parsed.error)).toContain("Number completed");
      }
    }

    const missing = nationalPartnerInitiativeSchema.safeParse({
      ...valid,
      nation: " ",
      area: "",
    });
    expect(missing.success).toBe(false);
    if (!missing.success) {
      const message = formatNationalPartnerInitiativeErrors(missing.error);
      expect(message).toContain("Nation");
      expect(message).toContain("Area / Region / State");
    }
  });

  it("does not keep a participant name", () => {
    const parsed = nationalPartnerInitiativeSchema.safeParse({ ...valid, name: "Ada" });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).not.toHaveProperty("name");
  });

  it("describes a count change and a removal", () => {
    expect(
      formatNationalPartnerInitiativeAudit({
        action: "UPDATED",
        nation: "Kenya",
        area: "Rift Valley",
        trainingType: "FOUR_FIELDS",
        completedCount: 25,
        previousNation: "Kenya",
        previousArea: "Rift Valley",
        previousTrainingType: "FOUR_FIELDS",
        previousCompletedCount: 40,
        createdAt: "2026-10-30T15:00:00.000Z",
      }),
    ).toContain("from 40 to 25");
    expect(
      formatNationalPartnerInitiativeAudit({
        action: "DELETED",
        nation: "Kenya",
        area: "Rift Valley",
        trainingType: "MEDICAL_TRAINING",
        completedCount: 25,
        previousNation: "Kenya",
        previousArea: "Rift Valley",
        previousTrainingType: "MEDICAL_TRAINING",
        previousCompletedCount: 25,
        createdAt: "2026-10-30T15:00:00.000Z",
      }),
    ).toContain("Removed");
  });
});

describe("national partner initiative boundaries", () => {
  it("adds tables without rewriting people, activities, legacy links, or recruits", () => {
    const sql = readFileSync(
      resolve(process.cwd(), "prisma/migrations/20261030180000_add_national_partner_initiatives/migration.sql"),
      "utf8",
    );
    const statements = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    expect(statements).toContain("ministry_national_partner_initiatives");
    expect(statements).toContain("'FOUR_FIELDS'");
    expect(statements.toLowerCase()).not.toContain("update ");
    expect(statements.toLowerCase()).not.toContain("insert ");
    expect(statements).not.toContain("ministry_people");
    expect(statements).not.toContain("ministry_activities");
    expect(statements).not.toContain("ministry_legacy_links");
    expect(statements).not.toContain("recruits");
  });

  it("counts initiatives on the server and leaves pathway rules and the homepage alone", () => {
    const db = readFileSync(resolve(process.cwd(), "src/lib/ministry/ministry-db.ts"), "utf8");
    const start = db.indexOf("export async function getMinistryOutcomeCounts");
    const body = db.slice(start, db.indexOf("export async function", start + 1));
    expect(body).toContain("ministryNationalPartnerInitiative");
    expect(body).toContain("countMinistryOutcomes");
    expect(body).not.toContain("recruit");
    expect(body).not.toContain("ministryLegacyLink");

    const save = readFileSync(resolve(process.cwd(), "src/lib/ministry/ministry-save.ts"), "utf8");
    expect(save).not.toContain("nationalPartner");
    expect(save).not.toContain("NationalPartnerInitiative");

    const initiativeDb = readFileSync(
      resolve(process.cwd(), "src/lib/ministry/national-partner-initiatives-db.ts"),
      "utf8",
    );
    expect(initiativeDb).not.toContain("ministryPerson");
    expect(initiativeDb).not.toContain("recruitRecord");
    expect(initiativeDb).not.toContain("ministryLegacyLink");

    const homepage = readFileSync(
      resolve(process.cwd(), "src/lib/site-builder/render-page.tsx"),
      "utf8",
    );
    expect(homepage).toContain("getMinistryOutcomeCounts");
    expect(homepage).not.toContain("getRecruitCounts");
    expect(nationalPartnerInitiativeCreateSchema.safeParse({ ...valid, submissionKey: "not-a-uuid" }).success).toBe(false);
  });
});

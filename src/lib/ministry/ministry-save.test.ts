import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import {
  initialMilestonesForPathway,
  resolveMinistryPersonSave,
  teamExpansionOutcomes,
  teamExpansionProgressDiscrepancy,
  type MinistrySaveStored,
  type MinistrySaveSubmission,
} from "./ministry-save";

function stored(overrides: Partial<MinistrySaveStored> = {}): MinistrySaveStored {
  return {
    mobilized: false,
    mobilizedOn: null,
    trainedEquipped: false,
    trainedEquippedOn: null,
    sent: false,
    sentOn: null,
    sentDesignation: null,
    sentVerifiedAt: null,
    sentVerifiedBy: "",
    sentVerificationNote: "",
    milestoneAudit: "",
    ...overrides,
  };
}

function submission(overrides: Partial<MinistrySaveSubmission> = {}): MinistrySaveSubmission {
  return {
    pathway: "TEAM_EXPANSION_RECRUIT",
    jonathanTrainingComplete: false,
    fullyFunded: false,
    mobilized: false,
    mobilizedOn: null,
    trainedEquipped: false,
    trainedEquippedOn: null,
    sent: false,
    sentOn: null,
    sentDesignation: null,
    sentVerifiedBy: "",
    sentVerificationNote: "",
    confirmHistoryChange: false,
    ...overrides,
  };
}

describe("Team Expansion Recruit progression", () => {
  it("records Mobilized for a new Team Expansion Recruit and leaves training and Sent off", () => {
    expect(initialMilestonesForPathway("TEAM_EXPANSION_RECRUIT")).toEqual({
      mobilized: true,
      trainedEquipped: false,
      sent: false,
      jonathanTrainingComplete: false,
      fullyFunded: false,
    });
    expect(teamExpansionOutcomes({ jonathanTrainingComplete: false, fullyFunded: false })).toEqual({
      mobilized: true,
      trainedEquipped: false,
      sent: false,
    });
  });

  it("does not record Mobilized for a new National Partner or Training Participant", () => {
    expect(initialMilestonesForPathway("NATIONAL_PARTNER").mobilized).toBe(false);
    expect(initialMilestonesForPathway("TRAINING_PARTICIPANT").mobilized).toBe(false);
    expect(initialMilestonesForPathway(null).mobilized).toBe(false);
  });

  it("records Trained & Equipped but not Sent when only Jonathan Training is complete", () => {
    const result = resolveMinistryPersonSave(
      stored(),
      submission({ jonathanTrainingComplete: true }),
      "2026-10-30",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.write.mobilized).toBe(true);
    expect(result.write.trainedEquipped).toBe(true);
    expect(result.write.sent).toBe(false);
    expect(result.write.fullyFunded).toBe(false);
    expect(result.write.sentDesignation).toBeNull();
    expect(result.write.sentOn).toBeNull();
  });

  it("keeps funding without training or Sent", () => {
    const result = resolveMinistryPersonSave(
      stored(),
      submission({ fullyFunded: true }),
      "2026-10-30",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.write.fullyFunded).toBe(true);
    expect(result.write.trainedEquipped).toBe(false);
    expect(result.write.sent).toBe(false);
    expect(result.write.mobilized).toBe(true);
  });

  it("records Trained & Equipped and Sent when both prerequisites and a designation are present", () => {
    const result = resolveMinistryPersonSave(
      stored(),
      submission({
        jonathanTrainingComplete: true,
        fullyFunded: true,
        sentDesignation: "INTERNATIONAL_SERVICES",
      }),
      "2026-10-30",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.write.trainedEquipped).toBe(true);
    expect(result.write.sent).toBe(true);
    expect(result.write.sentDesignation).toBe("INTERNATIONAL_SERVICES");
    expect(result.write.sentOn).toBeNull();
  });

  it("refuses Sent without a designation and produces no write", () => {
    const result = resolveMinistryPersonSave(
      stored(),
      submission({ jonathanTrainingComplete: true, fullyFunded: true }),
      "2026-10-30",
    );
    expect(result).toEqual({
      ok: false,
      error: "Choose a Sent designation",
      needsConfirmation: false,
    });
  });

  it("turns Sent off when either prerequisite is removed and keeps the recorded date", () => {
    const base = stored({
      mobilized: true,
      trainedEquipped: true,
      trainedEquippedOn: "2019-05-01",
      sent: true,
      sentOn: "2019-06-01",
      sentDesignation: "OVERSEAS_MISSIONARY",
      sentVerifiedBy: "Coach",
      sentVerificationNote: "Launched",
      sentVerifiedAt: "2019-06-01T00:00:00.000Z",
    });

    const fundedOnly = resolveMinistryPersonSave(
      base,
      submission({ fullyFunded: true, confirmHistoryChange: true }),
      "2026-10-30",
    );
    expect(fundedOnly.ok).toBe(true);
    if (!fundedOnly.ok) return;
    expect(fundedOnly.write.sent).toBe(false);
    expect(fundedOnly.write.trainedEquipped).toBe(false);
    expect(fundedOnly.write.sentOn).toBe("2019-06-01");
    expect(fundedOnly.write.trainedEquippedOn).toBe("2019-05-01");
    expect(fundedOnly.write.sentDesignation).toBeNull();
    expect(fundedOnly.write.sentVerifiedBy).toBe("Coach");
    expect(fundedOnly.write.sentVerificationNote).toBe("Launched");
    expect(fundedOnly.write.clearSentVerifiedAt).toBe(false);
    expect(fundedOnly.write.milestoneAudit).toContain("Overseas Missionary");
    expect(fundedOnly.write.milestoneAudit).toContain("2019-05-01");

    const trainedOnly = resolveMinistryPersonSave(
      base,
      submission({ jonathanTrainingComplete: true, confirmHistoryChange: true }),
      "2026-10-30",
    );
    expect(trainedOnly.ok).toBe(true);
    if (!trainedOnly.ok) return;
    expect(trainedOnly.write.trainedEquipped).toBe(true);
    expect(trainedOnly.write.sent).toBe(false);
    expect(trainedOnly.write.fullyFunded).toBe(false);
    expect(trainedOnly.write.sentOn).toBe("2019-06-01");
  });

  it("asks before turning off a completed Sent milestone", () => {
    const result = resolveMinistryPersonSave(
      stored({
        mobilized: true,
        sent: true,
        sentDesignation: "D_COURSE",
        sentOn: "2019-06-01",
      }),
      submission({ jonathanTrainingComplete: false, fullyFunded: false }),
      "2026-10-30",
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.needsConfirmation).toBe(true);
  });

  it("does not copy legacy checkbox values onto a historical person", () => {
    const result = resolveMinistryPersonSave(
      stored(),
      submission({
        pathway: null,
        jonathanTrainingComplete: false,
        fullyFunded: false,
        mobilized: false,
        trainedEquipped: false,
        sent: false,
      }),
      "2026-10-30",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.write.jonathanTrainingComplete).toBe(false);
    expect(result.write.fullyFunded).toBe(false);
    expect(result.write.mobilized).toBe(false);
    expect(result.write.trainedEquipped).toBe(false);
    expect(result.write.sent).toBe(false);
    expect(result.write.milestoneAudit).toBe("");
  });

  it("keeps an existing training date when the admin saves without changing it", () => {
    const result = resolveMinistryPersonSave(
      stored({
        mobilized: true,
        trainedEquipped: true,
        trainedEquippedOn: "2018-04-04",
      }),
      submission({ jonathanTrainingComplete: true, trainedEquippedOn: null }),
      "2026-10-30",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.write.trainedEquipped).toBe(true);
    expect(result.write.trainedEquippedOn).toBe("2018-04-04");
    expect(result.write.milestoneAudit).toBe("");
  });

  it("leaves National Partner and Training Participant milestones independent", () => {
    const national = resolveMinistryPersonSave(
      stored(),
      submission({
        pathway: "NATIONAL_PARTNER",
        jonathanTrainingComplete: true,
        fullyFunded: true,
        mobilized: false,
        trainedEquipped: false,
        sent: true,
        sentDesignation: "NATIONAL_WORKER",
      }),
      "2026-10-30",
    );
    expect(national.ok).toBe(true);
    if (!national.ok) return;
    expect(national.write.mobilized).toBe(false);
    expect(national.write.trainedEquipped).toBe(false);
    expect(national.write.sent).toBe(true);
    expect(national.write.fullyFunded).toBe(true);

    const participant = resolveMinistryPersonSave(
      stored({ trainedEquipped: true, trainedEquippedOn: "2021-01-01" }),
      submission({
        pathway: "TRAINING_PARTICIPANT",
        trainedEquipped: false,
        sent: true,
        sentDesignation: "OTHER_DISCIPLE_MAKER",
      }),
      "2026-10-30",
    );
    expect(participant.ok).toBe(true);
    if (!participant.ok) return;
    expect(participant.write.sent).toBe(true);
    expect(participant.write.trainedEquipped).toBe(false);
    expect(participant.write.trainedEquippedOn).toBeNull();
    expect(participant.write.mobilized).toBe(false);
  });

  it("shows a discrepancy instead of treating stored milestones as already corrected", () => {
    expect(
      teamExpansionProgressDiscrepancy(
        { mobilized: false, trainedEquipped: false, sent: true },
        { jonathanTrainingComplete: false, fullyFunded: false },
      ),
    ).toContain("Sent is saved");
    expect(
      teamExpansionProgressDiscrepancy(
        { mobilized: true, trainedEquipped: false, sent: false },
        { jonathanTrainingComplete: false, fullyFunded: false },
      ),
    ).toBeNull();
  });
});

describe("ministry save boundaries", () => {
  it("adds the progression columns without rewriting existing milestone rows", () => {
    const sql = readFileSync(
      resolve(process.cwd(), "prisma/migrations/20261030140000_add_team_expansion_recruit_progress/migration.sql"),
      "utf8",
    );
    expect(sql).toContain('"jonathan_training_complete" BOOLEAN NOT NULL DEFAULT false');
    expect(sql).toContain('"fully_funded" BOOLEAN NOT NULL DEFAULT false');
    expect(sql).toContain('"milestone_audit" TEXT NOT NULL DEFAULT');
    expect(sql.toLowerCase()).not.toContain("update ");
    expect(sql).not.toContain("ministry_legacy_links");
  });

  it("adds Launch as an activity label without rewriting people or activities", () => {
    const sql = readFileSync(
      resolve(process.cwd(), "prisma/migrations/20261030160000_add_launch_activity_type/migration.sql"),
      "utf8",
    );
    const statements = sql
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    expect(statements).toContain("ADD VALUE 'LAUNCH'");
    expect(statements.toLowerCase()).not.toContain("update ");
    expect(statements.toLowerCase()).not.toContain("insert ");
    expect(statements).not.toContain("ministry_people");
    expect(statements).not.toContain("ministry_activities");
    expect(statements).not.toContain("ministry_legacy_links");
    expect(statements).not.toContain("recruits");
  });

  it("saves a person in one transaction and does not touch legacy evidence or activities", () => {
    const db = readFileSync(resolve(process.cwd(), "src/lib/ministry/ministry-db.ts"), "utf8");
    const start = db.indexOf("export async function saveMinistryPersonChanges");
    const next = db.indexOf("export async function", start + 1);
    const body = db.slice(start, next === -1 ? undefined : next);
    expect(body).toContain("$transaction");
    expect(body).toContain("ministryActivity");
    expect(body).not.toContain("ministryLegacyLink");
    expect(body).not.toContain("recruitRecord");
    expect(db).toContain("initialMilestonesForPathway");
  });

  it("sends the canonical ministry totals to the homepage tracker", () => {
    const renderPage = readFileSync(
      resolve(process.cwd(), "src/lib/site-builder/render-page.tsx"),
      "utf8",
    );
    expect(renderPage).toContain("getMinistryOutcomeCounts");
    expect(renderPage).toContain("publicProgressCounts");
    expect(renderPage).toContain("noStore");
    expect(renderPage).not.toContain("getRecruitCounts");
    expect(renderPage).not.toContain("mobilized: 0");
    expect(renderPage).not.toContain("resolveMinistryPersonSave");
  });

  it("keeps Manage Person on one save that restores the list position", () => {
    const manager = readFileSync(
      resolve(process.cwd(), "src/app/admin/recruits/ministry-manager.tsx"),
      "utf8",
    );
    expect(manager).toContain("Save Changes");
    expect(manager).not.toContain("Save profile");
    expect(manager).not.toContain("Save milestones");
    expect(manager).toContain("Discard unsaved changes to this person?");
    expect(manager).toContain("refreshKeepingPlace");
    expect(manager).toContain("listScroll");
    expect(manager).toContain("saveMinistryPersonAction");
    expect(manager).not.toContain("Save or clear the activity form");
    expect(manager).not.toContain("Add activity");
    expect(manager).not.toContain("Save activity");
  });
});

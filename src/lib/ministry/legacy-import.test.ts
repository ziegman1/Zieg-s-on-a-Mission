import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";
import { LEGACY_COUPLE_SOURCE_NAMES, LEGACY_IMPORT_SOURCES } from "@/lib/ministry/legacy-import-map";
import {
  importOperations,
  planLegacyImport,
  protectedExistingNames,
  type LegacyRecruitSnapshot,
} from "@/lib/ministry/legacy-import";
import { ministryMilestoneSchema } from "@/lib/ministry/ministry-form";
import { countMinistryOutcomes } from "@/lib/ministry/ministry-milestones";
import {
  LEFTOVER_TEST_CONFIRMATION,
  LEFTOVER_TEST_PERSON_ID,
  leftoverTestRemovalError,
  legacyReviewSchema,
  proposedVerifiedOutcomes,
  reviewProgress,
  reviewProgressLabel,
} from "@/lib/ministry/legacy-review";

const COUPLES: Record<string, [string, string]> = {
  "Austin and Katherine Barr": ["Austin Barr", "Katherine Barr"],
  "Chris and Mary Clark": ["Chris Clark", "Mary Clark"],
  "Jay and Carolyn Wettstone": ["Jay Wettstone", "Carolyn Wettstone"],
  "Jody and Roger Wills": ["Jody Wills", "Roger Wills"],
  "Peter and Elizabeth O'Conner": ["Peter O'Conner", "Elizabeth O'Conner"],
};

const LEGITIMATE = [
  "Jerry Anderson",
  "John Blakeslee",
  "Carter Frantz",
  "John Hicks",
  "Wendy Scarborough",
  "Olivia Camp",
];

function roster(): LegacyRecruitSnapshot[] {
  return LEGACY_IMPORT_SOURCES.map((source, index) => ({
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    name: source.sourceName,
    jonathanTrainingComplete: source.sourceName === "Alys West",
    fullyFunded: source.sourceName === "Alys West",
  }));
}

describe("legacy import mapping", () => {
  const recruits = roster();
  const plan = planLegacyImport(recruits);

  it("maps 30 legacy rows to 35 individuals", () => {
    expect(LEGACY_IMPORT_SOURCES).toHaveLength(30);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.individuals).toHaveLength(35);
    expect(new Set(plan.individuals.map((person) => person.legacyRecruitId)).size).toBe(30);
  });

  it("splits only the five reviewed couple rows", () => {
    expect(LEGACY_COUPLE_SOURCE_NAMES).toEqual(Object.keys(COUPLES));
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    for (const [source, names] of Object.entries(COUPLES)) {
      const people = plan.individuals.filter((person) => person.originalDisplayName === source);
      expect(people.map((person) => person.displayName)).toEqual(names);
      expect(people.every((person) => person.shareHousehold)).toBe(true);
      expect(new Set(people.map((person) => person.legacyRecruitId)).size).toBe(1);
    }
    const otherAnd = plan.individuals.filter(
      (person) => person.displayName.includes(" and ") && !Object.values(COUPLES).flat().includes(person.displayName),
    );
    expect(otherAnd).toEqual([]);
  });

  it("keeps Luke and Tiffany as one person each, with Cody's Team in notes", () => {
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    for (const source of ["Luke (Cody's Team)", "Tiffany (Cody's Team)"]) {
      const people = plan.individuals.filter((person) => person.originalDisplayName === source);
      expect(people).toHaveLength(1);
      expect(people[0]?.displayName).toBe(source);
      expect(people[0]?.notes).toBe("Cody's Team");
      expect(people[0]?.shareHousehold).toBe(false);
    }
  });

  it("does not split an unreviewed name that contains and", () => {
    const extra = planLegacyImport([
      ...recruits,
      {
        id: "00000000-0000-4000-8000-000000000099",
        name: "Bob and Sue Example",
        jonathanTrainingComplete: true,
        fullyFunded: true,
      },
    ]);
    expect(extra.ok).toBe(false);
    if (extra.ok) return;
    expect(extra.unexpectedRecruits).toContain("Bob and Sue Example");
  });

  it("preserves the original legacy evidence and assigns no milestones", () => {
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const alys = plan.individuals.find((person) => person.displayName === "Alys West");
    expect(alys).toMatchObject({
      originalDisplayName: "Alys West",
      originalJonathanTraining: true,
      originalFullyFunded: true,
      mobilized: false,
      trainedEquipped: false,
      sent: false,
    });
    expect(alys?.evidence).toContain("Jonathan Training was checked");
    expect(alys?.evidence).toContain("Fully Funded was checked");
    expect(alys?.evidence).toContain("not confirmed milestones");
    expect(plan.individuals.every((person) => !person.mobilized && !person.trainedEquipped && !person.sent)).toBe(
      true,
    );
    expect("activityType" in (plan.individuals[0] ?? {})).toBe(false);
  });

  it("is idempotent when the same links already exist", () => {
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const first = importOperations(plan.individuals, []);
    expect(first.create).toHaveLength(35);
    expect(first.skip).toHaveLength(0);
    const second = importOperations(
      plan.individuals,
      plan.individuals.map((person) => ({
        legacyRecruitId: person.legacyRecruitId,
        individualKey: person.individualKey,
      })),
    );
    expect(second.create).toHaveLength(0);
    expect(second.skip).toHaveLength(35);
  });

  it("leaves the six legitimate ministry people out of the import", () => {
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    for (const name of [...LEGITIMATE, "Verification Person Updated"]) {
      expect(plan.individuals.some((person) => person.displayName === name)).toBe(false);
    }
    expect(protectedExistingNames([...LEGITIMATE, "Verification Person Updated"], plan.individuals)).toEqual([
      ...LEGITIMATE,
      "Verification Person Updated",
    ]);
  });
});

describe("legacy review", () => {
  it("keeps review status independent of milestones", () => {
    const pending = Array.from({ length: 35 }, () => "PENDING_REVIEW" as const);
    expect(reviewProgressLabel(reviewProgress(pending))).toBe("0 of 35 reviewed");
    const mixed = reviewProgress(["CONFIRMED", "NEEDS_CLARIFICATION", "PENDING_REVIEW"]);
    expect(mixed).toEqual({ reviewed: 2, total: 3 });
    expect(legacyReviewSchema.safeParse({ reviewStatus: "CONFIRMED", notes: "Checked the file." }).success).toBe(
      true,
    );
    expect("mobilized" in legacyReviewSchema.shape).toBe(false);
  });

  it("still requires a Sent designation through the existing milestone schema", () => {
    const parsed = ministryMilestoneSchema.safeParse({
      mobilized: false,
      mobilizedOn: "",
      trainedEquipped: false,
      trainedEquippedOn: "",
      sent: true,
      sentOn: "",
      sentDesignation: "",
      sentVerifiedBy: "",
      sentVerificationNote: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("holds the leftover test id out of proposed totals without using a display name", () => {
    const people = [
      { id: LEFTOVER_TEST_PERSON_ID, displayName: "Verification Person Updated", mobilized: true, trainedEquipped: false, sent: false },
      { id: "someone-else", displayName: "Verification Person Updated", mobilized: true, trainedEquipped: true, sent: true },
    ];
    expect(countMinistryOutcomes(people)).toEqual({ mobilized: 2, trainedEquipped: 1, sent: 1 });
    expect(proposedVerifiedOutcomes(people)).toEqual({ mobilized: 1, trainedEquipped: 1, sent: 1 });
    expect(leftoverTestRemovalError("someone-else", LEFTOVER_TEST_CONFIRMATION)).toMatch(/not the leftover/);
    expect(leftoverTestRemovalError(LEFTOVER_TEST_PERSON_ID, "delete")).toMatch(/confirmation/);
    expect(leftoverTestRemovalError(LEFTOVER_TEST_PERSON_ID, LEFTOVER_TEST_CONFIRMATION)).toBeNull();
  });
});

describe("legacy reconciliation safety", () => {
  const migration = readFileSync(
    resolve(process.cwd(), "prisma/migrations/20261029160000_add_ministry_legacy_links/migration.sql"),
    "utf8",
  );
  const importer = readFileSync(resolve(process.cwd(), "src/lib/ministry/legacy-import-db.ts"), "utf8");
  const homepage = readFileSync(resolve(process.cwd(), "src/lib/site-builder/render-page.tsx"), "utf8");
  const actions = readFileSync(resolve(process.cwd(), "src/app/admin/recruits/legacy-actions.ts"), "utf8");

  it("adds only the reconciliation table", () => {
    const statements = migration
      .replace(/--.*$/gm, "")
      .split(";")
      .map((statement) => statement.trim())
      .filter(Boolean);
    expect(statements.every((statement) => /^(CREATE|ALTER|REVOKE)/.test(statement))).toBe(true);
    expect(statements.some((statement) => statement.includes("ministry_legacy_links"))).toBe(true);
    expect(statements.some((statement) => /recruits|ministry_people|ministry_activities/.test(statement) && /^(UPDATE|DELETE|INSERT|DROP)/.test(statement))).toBe(false);
    expect(migration).toContain("DROP TABLE public.ministry_legacy_links");
    expect(migration).toContain("does not remove ministry_people");
  });

  it("does not write recruit rows and leaves the homepage on the legacy count", () => {
    expect(importer).not.toContain("recruitRecord.update");
    expect(importer).not.toContain("recruitRecord.delete");
    expect(importer).toContain("pg_advisory_xact_lock");
    expect(homepage).toContain("getRecruitCounts");
    expect(homepage).not.toContain("getMinistryOutcomeCounts");
    expect(homepage).not.toContain("planLegacyImport");
    for (const name of [
      "importLegacyRosterAction",
      "updateLegacyReviewAction",
      "removeLeftoverTestPersonAction",
    ]) {
      const body = actions.slice(actions.indexOf(`export async function ${name}`));
      const guardAt = body.indexOf("requireAdminOnlySession");
      const nextExportAt = body.indexOf("export async function", 1);
      expect(guardAt).toBeGreaterThan(-1);
      if (nextExportAt > -1) expect(guardAt).toBeLessThan(nextExportAt);
    }
  });
});

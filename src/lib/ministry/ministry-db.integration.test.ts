import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createMinistryActivity,
  createMinistryPerson,
  deleteMinistryPerson,
  getMinistryOutcomeCounts,
  setMinistryHousehold,
  updateMinistryMilestones,
} from "./ministry-db";

const databaseUrl = process.env.MINISTRY_TEST_DATABASE_URL;
const describeIf = databaseUrl ? describe : describe.skip;

describeIf("ministry database behavior on an isolated database", () => {
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  let recruitId = "";

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("confirms milestones explicitly and leaves the legacy recruit row alone", async () => {
    const recruit = await prisma.recruitRecord.create({
      data: { name: "Legacy Couple Name", jonathanTrainingComplete: true, fullyFunded: true },
    });
    recruitId = recruit.id;

    const first = await createMinistryPerson({
      displayName: "Spouse A",
      pathway: null,
      notes: "",
    });
    expect(await getMinistryOutcomeCounts()).toEqual({
      individuals: { mobilized: 0, trainedEquipped: 0, sent: 0 },
      nationalPartnerInitiatives: { mobilized: 0, trainedEquipped: 0, sent: 0 },
      unified: { mobilized: 0, trainedEquipped: 0, sent: 0 },
    });

    await updateMinistryMilestones(first.id, {
      mobilized: true,
      mobilizedOn: null,
      trainedEquipped: false,
      trainedEquippedOn: null,
      sent: false,
      sentOn: null,
      sentDesignation: null,
      sentVerifiedBy: "",
      sentVerificationNote: "",
    });

    const second = await createMinistryPerson({
      displayName: "Spouse B",
      pathway: "TRAINING_PARTICIPANT",
      notes: "",
    });
    await updateMinistryMilestones(second.id, {
      mobilized: false,
      mobilizedOn: null,
      trainedEquipped: false,
      trainedEquippedOn: null,
      sent: true,
      sentOn: null,
      sentDesignation: "OTHER_DISCIPLE_MAKER",
      sentVerifiedBy: "Coach",
      sentVerificationNote: "Reported implementation",
    });
    await setMinistryHousehold(second.id, first.id);
    await createMinistryActivity(second.id, {
      activityType: "FIDELIS",
      status: "COMPLETED",
      activityOn: null,
      location: "",
      notes: "",
    });

    expect(await getMinistryOutcomeCounts()).toEqual({
      individuals: { mobilized: 1, trainedEquipped: 0, sent: 1 },
      nationalPartnerInitiatives: { mobilized: 0, trainedEquipped: 0, sent: 0 },
      unified: { mobilized: 1, trainedEquipped: 0, sent: 1 },
    });

    const stored = await prisma.ministryPerson.findMany({
      include: { activities: true },
      orderBy: { displayName: "asc" },
    });
    expect(stored).toHaveLength(2);
    expect(stored[0].householdId).toBe(stored[1].householdId);
    expect(stored[0].mobilized).toBe(true);
    expect(stored[0].sent).toBe(false);
    expect(stored[1].sent).toBe(true);
    expect(stored[1].mobilized).toBe(false);
    expect(stored[1].activities[0].activityType).toBe("FIDELIS");

    const unchanged = await prisma.recruitRecord.findUniqueOrThrow({ where: { id: recruitId } });
    expect(unchanged.jonathanTrainingComplete).toBe(true);
    expect(unchanged.fullyFunded).toBe(true);
    expect(unchanged.name).toBe("Legacy Couple Name");

    await expect(
      prisma.ministryPerson.create({
        data: { displayName: "Missing designation", sent: true },
      }),
    ).rejects.toThrow(/ministry_people_sent_designation_check/);

    await deleteMinistryPerson(first.id);
    await deleteMinistryPerson(second.id);
    await prisma.recruitRecord.delete({ where: { id: recruitId } });
    expect(await prisma.ministryPerson.count()).toBe(0);
    expect(await prisma.recruitRecord.count()).toBe(0);
  });
});

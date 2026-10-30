import "server-only";

import { randomUUID } from "crypto";
import type {
  MinistryActivity,
  MinistryPathway,
  MinistryPerson,
  MinistrySentDesignation,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { fromCalendarDay, toCalendarDay } from "@/lib/ministry/ministry-form";
import { countMinistryOutcomes, type MinistryOutcomeCounts } from "@/lib/ministry/ministry-milestones";
import {
  initialMilestonesForPathway,
  MinistrySaveRejected,
  resolveMinistryPersonSave,
  type MinistrySaveStored,
  type MinistrySaveSubmission,
} from "@/lib/ministry/ministry-save";

export type MinistryActivityView = {
  id: string;
  activityType: MinistryActivity["activityType"];
  status: MinistryActivity["status"];
  activityOn: string | null;
  location: string;
  notes: string;
};

export type MinistryPersonView = {
  id: string;
  displayName: string;
  pathway: MinistryPathway | null;
  legacyRecruitId: string | null;
  householdId: string | null;
  mobilized: boolean;
  mobilizedOn: string | null;
  trainedEquipped: boolean;
  trainedEquippedOn: string | null;
  sent: boolean;
  sentOn: string | null;
  sentDesignation: MinistrySentDesignation | null;
  sentVerifiedAt: string | null;
  sentVerifiedBy: string;
  sentVerificationNote: string;
  notes: string;
  jonathanTrainingComplete: boolean;
  fullyFunded: boolean;
  milestoneAudit: string;
  activities: MinistryActivityView[];
};

type PersonWithActivities = MinistryPerson & { activities: MinistryActivity[] };

function toView(person: PersonWithActivities): MinistryPersonView {
  return {
    id: person.id,
    displayName: person.displayName,
    pathway: person.pathway,
    legacyRecruitId: person.legacyRecruitId,
    householdId: person.householdId,
    mobilized: person.mobilized,
    mobilizedOn: toCalendarDay(person.mobilizedOn),
    trainedEquipped: person.trainedEquipped,
    trainedEquippedOn: toCalendarDay(person.trainedEquippedOn),
    sent: person.sent,
    sentOn: toCalendarDay(person.sentOn),
    sentDesignation: person.sentDesignation,
    sentVerifiedAt: person.sentVerifiedAt ? person.sentVerifiedAt.toISOString() : null,
    sentVerifiedBy: person.sentVerifiedBy ?? "",
    sentVerificationNote: person.sentVerificationNote,
    notes: person.notes,
    jonathanTrainingComplete: person.jonathanTrainingComplete,
    fullyFunded: person.fullyFunded,
    milestoneAudit: person.milestoneAudit,
    activities: person.activities.map((activity) => ({
      id: activity.id,
      activityType: activity.activityType,
      status: activity.status,
      activityOn: toCalendarDay(activity.activityOn),
      location: activity.location ?? "",
      notes: activity.notes,
    })),
  };
}

const personInclude = {
  activities: { orderBy: { createdAt: "desc" as const } },
};

export async function listMinistryPeople(): Promise<MinistryPersonView[]> {
  const rows = await prisma.ministryPerson.findMany({
    include: personInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toView);
}

export async function getMinistryOutcomeCounts(): Promise<MinistryOutcomeCounts> {
  const rows = await prisma.ministryPerson.findMany({
    select: { mobilized: true, trainedEquipped: true, sent: true },
  });
  return countMinistryOutcomes(rows);
}

/**
 * A new person starts with every milestone unset, except a new Team Expansion Recruit,
 * who is Mobilized. Training, funding, and Sent stay off until an admin confirms them.
 */
export async function createMinistryPerson(input: {
  displayName: string;
  pathway: MinistryPathway | null;
  notes: string;
}): Promise<MinistryPersonView> {
  const milestones = initialMilestonesForPathway(input.pathway);
  const row = await prisma.ministryPerson.create({
    data: {
      displayName: input.displayName,
      pathway: input.pathway,
      notes: input.notes,
      mobilized: milestones.mobilized,
      trainedEquipped: milestones.trainedEquipped,
      sent: milestones.sent,
      jonathanTrainingComplete: milestones.jonathanTrainingComplete,
      fullyFunded: milestones.fullyFunded,
    },
    include: personInclude,
  });
  return toView(row);
}

export async function getMinistryPerson(id: string): Promise<MinistryPersonView | null> {
  const row = await prisma.ministryPerson.findUnique({
    where: { id },
    include: personInclude,
  });
  return row ? toView(row) : null;
}

function storedMilestones(person: MinistryPerson): MinistrySaveStored {
  return {
    mobilized: person.mobilized,
    mobilizedOn: toCalendarDay(person.mobilizedOn),
    trainedEquipped: person.trainedEquipped,
    trainedEquippedOn: toCalendarDay(person.trainedEquippedOn),
    sent: person.sent,
    sentOn: toCalendarDay(person.sentOn),
    sentDesignation: person.sentDesignation,
    sentVerifiedAt: person.sentVerifiedAt ? person.sentVerifiedAt.toISOString() : null,
    sentVerifiedBy: person.sentVerifiedBy ?? "",
    sentVerificationNote: person.sentVerificationNote,
    milestoneAudit: person.milestoneAudit,
  };
}

/**
 * Profile, household, and milestones in one transaction.
 * Does not create activities, write recruits, or update legacy reconciliation links.
 */
export async function saveMinistryPersonChanges(
  id: string,
  input: {
    displayName: string;
    pathway: MinistryPathway | null;
    notes: string;
    legacyRecruitId: string | null;
    householdWithPersonId: string | null;
    submission: MinistrySaveSubmission;
    recordedOn: string;
  },
): Promise<MinistryPersonView> {
  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.ministryPerson.findUnique({ where: { id } });
      if (!existing) throw new Error("That person no longer exists.");
      if (input.householdWithPersonId === id) {
        throw new Error("A person cannot be their own household.");
      }

      const resolved = resolveMinistryPersonSave(
        storedMilestones(existing),
        input.submission,
        input.recordedOn,
      );
      if (!resolved.ok) {
        throw new MinistrySaveRejected(resolved.error, resolved.needsConfirmation);
      }

      let householdId: string | null = null;
      if (input.householdWithPersonId) {
        const other = await tx.ministryPerson.findUnique({
          where: { id: input.householdWithPersonId },
          select: { id: true, householdId: true },
        });
        if (!other) throw new Error("The selected household person no longer exists.");
        householdId = other.householdId ?? randomUUID();
        if (!other.householdId) {
          await tx.ministryPerson.update({
            where: { id: other.id },
            data: { householdId },
          });
        }
      }

      const write = resolved.write;
      let sentVerifiedAt = existing.sentVerifiedAt;
      if (write.clearSentVerifiedAt) {
        sentVerifiedAt = null;
      } else if (write.touchSentVerifiedAt && !existing.sentVerifiedAt) {
        sentVerifiedAt = new Date();
      }

      const row = await tx.ministryPerson.update({
        where: { id },
        data: {
          displayName: input.displayName,
          pathway: input.pathway,
          notes: input.notes,
          legacyRecruitId: input.legacyRecruitId,
          householdId,
          jonathanTrainingComplete: write.jonathanTrainingComplete,
          fullyFunded: write.fullyFunded,
          mobilized: write.mobilized,
          mobilizedOn: fromCalendarDay(write.mobilizedOn),
          trainedEquipped: write.trainedEquipped,
          trainedEquippedOn: fromCalendarDay(write.trainedEquippedOn),
          sent: write.sent,
          sentOn: fromCalendarDay(write.sentOn),
          sentDesignation: write.sentDesignation,
          sentVerifiedBy: write.sentVerifiedBy.trim() || null,
          sentVerificationNote: write.sentVerificationNote,
          sentVerifiedAt,
          milestoneAudit: write.milestoneAudit,
        },
        include: personInclude,
      });
      return toView(row);
    },
    { maxWait: 15_000, timeout: 60_000 },
  );
}

export async function updateMinistryPerson(
  id: string,
  input: {
    displayName: string;
    pathway: MinistryPathway | null;
    notes: string;
    legacyRecruitId: string | null;
  },
): Promise<MinistryPersonView> {
  const row = await prisma.ministryPerson.update({
    where: { id },
    data: {
      displayName: input.displayName,
      pathway: input.pathway,
      notes: input.notes,
      legacyRecruitId: input.legacyRecruitId,
    },
    include: personInclude,
  });
  return toView(row);
}

/**
 * Join this person to another person's household, or clear only this person's link.
 * Milestones are never copied. The other person's row is touched only to share an id
 * when they did not have one yet.
 */
export async function setMinistryHousehold(
  personId: string,
  otherPersonId: string | null,
): Promise<void> {
  if (!otherPersonId || otherPersonId === personId) {
    await prisma.ministryPerson.update({
      where: { id: personId },
      data: { householdId: null },
    });
    return;
  }

  const other = await prisma.ministryPerson.findUnique({
    where: { id: otherPersonId },
    select: { householdId: true },
  });
  if (!other) {
    throw new Error("The selected household person no longer exists.");
  }

  const householdId = other.householdId ?? randomUUID();
  await prisma.$transaction([
    prisma.ministryPerson.update({
      where: { id: personId },
      data: { householdId },
    }),
    prisma.ministryPerson.update({
      where: { id: otherPersonId },
      data: { householdId },
    }),
  ]);
}

export async function updateMinistryMilestones(
  id: string,
  input: {
    mobilized: boolean;
    mobilizedOn: string | null;
    trainedEquipped: boolean;
    trainedEquippedOn: string | null;
    sent: boolean;
    sentOn: string | null;
    sentDesignation: MinistrySentDesignation | null;
    sentVerifiedBy: string;
    sentVerificationNote: string;
  },
): Promise<MinistryPersonView> {
  const existing = await prisma.ministryPerson.findUnique({
    where: { id },
    select: { sentVerifiedAt: true },
  });
  if (!existing) {
    throw new Error("That person no longer exists.");
  }

  const verifier = input.sent ? input.sentVerifiedBy.trim() : "";
  let sentVerifiedAt: Date | null = null;
  if (input.sent && verifier) {
    sentVerifiedAt = existing.sentVerifiedAt ?? new Date();
  }

  const row = await prisma.ministryPerson.update({
    where: { id },
    data: {
      mobilized: input.mobilized,
      mobilizedOn: input.mobilized ? fromCalendarDay(input.mobilizedOn) : null,
      trainedEquipped: input.trainedEquipped,
      trainedEquippedOn: input.trainedEquipped
        ? fromCalendarDay(input.trainedEquippedOn)
        : null,
      sent: input.sent,
      sentOn: input.sent ? fromCalendarDay(input.sentOn) : null,
      sentDesignation: input.sent ? input.sentDesignation : null,
      sentVerifiedBy: verifier || null,
      sentVerificationNote: input.sent ? input.sentVerificationNote.trim() : "",
      sentVerifiedAt,
    },
    include: personInclude,
  });
  return toView(row);
}

export async function deleteMinistryPerson(id: string): Promise<void> {
  await prisma.ministryPerson.delete({ where: { id } });
}

export async function createMinistryActivity(
  personId: string,
  input: {
    activityType: MinistryActivity["activityType"];
    status: MinistryActivity["status"];
    activityOn: string | null;
    location: string;
    notes: string;
  },
): Promise<void> {
  await prisma.ministryActivity.create({
    data: {
      personId,
      activityType: input.activityType,
      status: input.status,
      activityOn: fromCalendarDay(input.activityOn),
      location: input.location.trim() || null,
      notes: input.notes,
    },
  });
}

export async function updateMinistryActivity(
  id: string,
  input: {
    activityType: MinistryActivity["activityType"];
    status: MinistryActivity["status"];
    activityOn: string | null;
    location: string;
    notes: string;
  },
): Promise<void> {
  await prisma.ministryActivity.update({
    where: { id },
    data: {
      activityType: input.activityType,
      status: input.status,
      activityOn: fromCalendarDay(input.activityOn),
      location: input.location.trim() || null,
      notes: input.notes,
    },
  });
}

export async function deleteMinistryActivity(id: string): Promise<void> {
  await prisma.ministryActivity.delete({ where: { id } });
}

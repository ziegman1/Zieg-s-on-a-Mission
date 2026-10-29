import "server-only";

import { randomUUID } from "crypto";
import type { MinistryLegacyReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  importOperations,
  planLegacyImport,
  type PlannedLegacyIndividual,
} from "@/lib/ministry/legacy-import";
import { toCalendarDay } from "@/lib/ministry/ministry-form";
import type { LegacyLinkView } from "@/lib/ministry/legacy-link";

const linkInclude = {
  person: {
    select: {
      id: true,
      displayName: true,
      pathway: true,
      householdId: true,
      mobilized: true,
      mobilizedOn: true,
      trainedEquipped: true,
      trainedEquippedOn: true,
      sent: true,
      sentOn: true,
      sentDesignation: true,
      sentVerifiedBy: true,
      sentVerificationNote: true,
    },
  },
} as const;


export async function listLegacyLinks(): Promise<LegacyLinkView[]> {
  const rows = await prisma.ministryLegacyLink.findMany({
    include: linkInclude,
    orderBy: [{ originalDisplayName: "asc" }, { individualKey: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    individualKey: row.individualKey,
    legacyRecruitId: row.legacyRecruitId,
    originalDisplayName: row.originalDisplayName,
    originalJonathanTraining: row.originalJonathanTraining,
    originalFullyFunded: row.originalFullyFunded,
    evidence: row.evidence,
    reviewStatus: row.reviewStatus,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    reviewedBy: row.reviewedBy ?? "",
    notes: row.notes,
    person: {
      id: row.person.id,
      displayName: row.person.displayName,
      pathway: row.person.pathway,
      householdId: row.person.householdId,
      mobilized: row.person.mobilized,
      mobilizedOn: toCalendarDay(row.person.mobilizedOn),
      trainedEquipped: row.person.trainedEquipped,
      trainedEquippedOn: toCalendarDay(row.person.trainedEquippedOn),
      sent: row.person.sent,
      sentOn: toCalendarDay(row.person.sentOn),
      sentDesignation: row.person.sentDesignation,
      sentVerifiedBy: row.person.sentVerifiedBy ?? "",
      sentVerificationNote: row.person.sentVerificationNote,
    },
  }));
}

export async function importLegacyRecruitRoster(): Promise<{ created: number; skipped: number }> {
  return prisma.$transaction(
    async (tx) => {
    await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock(872341)");

    const before = await tx.recruitRecord.findMany({
      select: {
        id: true,
        name: true,
        jonathanTrainingComplete: true,
        fullyFunded: true,
      },
      orderBy: { id: "asc" },
    });
    const plan = planLegacyImport(before);
    if (!plan.ok) {
      throw new Error(plan.error);
    }

    const existing = await tx.ministryLegacyLink.findMany({
      select: {
        legacyRecruitId: true,
        individualKey: true,
        person: { select: { householdId: true } },
      },
    });
    const operations = importOperations(plan.individuals, existing);
    const existingNames = new Set(
      (
        await tx.ministryPerson.findMany({
          select: { displayName: true },
        })
      ).map((person) => person.displayName),
    );
    for (const individual of operations.create) {
      if (existingNames.has(individual.displayName)) {
        throw new Error(
          `"${individual.displayName}" already exists and was left unchanged. Nothing was imported.`,
        );
      }
    }

    const householdByRecruit = new Map<string, string>();
    for (const link of existing) {
      if (link.person.householdId) {
        householdByRecruit.set(link.legacyRecruitId, link.person.householdId);
      }
    }

    for (const individual of operations.create) {
      const householdId = householdIdFor(individual, householdByRecruit);
      const person = await tx.ministryPerson.create({
        data: {
          displayName: individual.displayName,
          notes: individual.notes,
          legacyRecruitId: individual.legacyRecruitId,
          householdId,
        },
      });
      await tx.ministryLegacyLink.create({
        data: {
          legacyRecruitId: individual.legacyRecruitId,
          individualKey: individual.individualKey,
          originalDisplayName: individual.originalDisplayName,
          originalJonathanTraining: individual.originalJonathanTraining,
          originalFullyFunded: individual.originalFullyFunded,
          personId: person.id,
          evidence: individual.evidence,
        },
      });
      existingNames.add(individual.displayName);
    }

    const after = await tx.recruitRecord.findMany({
      select: {
        id: true,
        name: true,
        jonathanTrainingComplete: true,
        fullyFunded: true,
      },
      orderBy: { id: "asc" },
    });
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      throw new Error("The import tried to change a legacy recruit row and was rolled back.");
    }

    return { created: operations.create.length, skipped: operations.skip.length };
    },
    { maxWait: 15_000, timeout: 60_000 },
  );
}

function householdIdFor(
  individual: PlannedLegacyIndividual,
  householdByRecruit: Map<string, string>,
): string | null {
  if (!individual.shareHousehold) return null;
  const existing = householdByRecruit.get(individual.legacyRecruitId);
  if (existing) return existing;
  const created = randomUUID();
  householdByRecruit.set(individual.legacyRecruitId, created);
  return created;
}

export async function updateLegacyReview(
  linkId: string,
  input: { reviewStatus: MinistryLegacyReviewStatus; notes: string },
  reviewerId: string,
): Promise<void> {
  const existing = await prisma.ministryLegacyLink.findUnique({
    where: { id: linkId },
    select: { reviewStatus: true, reviewedAt: true },
  });
  if (!existing) throw new Error("That reconciliation record no longer exists.");

  const reviewed = input.reviewStatus !== "PENDING_REVIEW";
  await prisma.ministryLegacyLink.update({
    where: { id: linkId },
    data: {
      reviewStatus: input.reviewStatus,
      notes: input.notes,
      reviewedBy: reviewed ? reviewerId : null,
      reviewedAt: reviewed ? (existing.reviewedAt ?? new Date()) : null,
    },
  });
}

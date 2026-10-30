import "server-only";

import { prisma } from "@/lib/db";
import type {
  NationalPartnerInitiativeAuditView,
  NationalPartnerInitiativeInput,
  NationalPartnerInitiativeView,
  NationalPartnerTrainingType,
} from "@/lib/ministry/national-partner-initiatives";

export type { NationalPartnerInitiativeAuditView, NationalPartnerInitiativeView };

type InitiativeRow = {
  id: string;
  nation: string;
  area: string;
  trainingType: NationalPartnerTrainingType;
  completedCount: number;
};

function toView(row: InitiativeRow): NationalPartnerInitiativeView {
  return {
    id: row.id,
    nation: row.nation,
    area: row.area,
    trainingType: row.trainingType,
    completedCount: row.completedCount,
  };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export function isMissingNationalPartnerInitiativeTable(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "P2021") {
    return true;
  }
  const message = error instanceof Error ? error.message : "";
  return message.includes("ministry_national_partner_initiatives");
}

export async function listNationalPartnerInitiatives(): Promise<NationalPartnerInitiativeView[]> {
  const rows = await prisma.ministryNationalPartnerInitiative.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toView);
}

export async function listNationalPartnerInitiativeAudits(): Promise<NationalPartnerInitiativeAuditView[]> {
  const rows = await prisma.ministryNationalPartnerInitiativeAudit.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return rows.map((row) => ({
    id: row.id,
    initiativeId: row.initiativeId,
    action: row.action,
    nation: row.nation,
    area: row.area,
    trainingType: row.trainingType,
    completedCount: row.completedCount,
    previousNation: row.previousNation,
    previousArea: row.previousArea,
    previousTrainingType: row.previousTrainingType,
    previousCompletedCount: row.previousCompletedCount,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function createNationalPartnerInitiative(
  input: NationalPartnerInitiativeInput & { submissionKey: string },
): Promise<NationalPartnerInitiativeView> {
  const existing = await prisma.ministryNationalPartnerInitiative.findUnique({
    where: { submissionKey: input.submissionKey },
  });
  if (existing) return toView(existing);

  try {
    return await prisma.$transaction(async (tx) => {
      const row = await tx.ministryNationalPartnerInitiative.create({
        data: {
          submissionKey: input.submissionKey,
          nation: input.nation,
          area: input.area,
          trainingType: input.trainingType,
          completedCount: input.completedCount,
        },
      });
      await tx.ministryNationalPartnerInitiativeAudit.create({
        data: {
          initiativeId: row.id,
          action: "CREATED",
          nation: row.nation,
          area: row.area,
          trainingType: row.trainingType,
          completedCount: row.completedCount,
        },
      });
      return toView(row);
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const winner = await prisma.ministryNationalPartnerInitiative.findUnique({
      where: { submissionKey: input.submissionKey },
    });
    if (!winner) throw error;
    return toView(winner);
  }
}

function sameInitiative(row: InitiativeRow, input: NationalPartnerInitiativeInput): boolean {
  return (
    row.nation === input.nation &&
    row.area === input.area &&
    row.trainingType === input.trainingType &&
    row.completedCount === input.completedCount
  );
}

export async function updateNationalPartnerInitiative(
  id: string,
  input: NationalPartnerInitiativeInput,
): Promise<NationalPartnerInitiativeView> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.ministryNationalPartnerInitiative.findUnique({ where: { id } });
    if (!existing) throw new Error("That initiative no longer exists.");
    if (sameInitiative(existing, input)) return toView(existing);

    const row = await tx.ministryNationalPartnerInitiative.update({
      where: { id },
      data: {
        nation: input.nation,
        area: input.area,
        trainingType: input.trainingType,
        completedCount: input.completedCount,
      },
    });
    await tx.ministryNationalPartnerInitiativeAudit.create({
      data: {
        initiativeId: row.id,
        action: "UPDATED",
        nation: row.nation,
        area: row.area,
        trainingType: row.trainingType,
        completedCount: row.completedCount,
        previousNation: existing.nation,
        previousArea: existing.area,
        previousTrainingType: existing.trainingType,
        previousCompletedCount: existing.completedCount,
      },
    });
    return toView(row);
  });
}

export async function deleteNationalPartnerInitiative(id: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.ministryNationalPartnerInitiative.findUnique({ where: { id } });
    if (!existing) throw new Error("That initiative no longer exists.");
    await tx.ministryNationalPartnerInitiativeAudit.create({
      data: {
        initiativeId: existing.id,
        action: "DELETED",
        nation: existing.nation,
        area: existing.area,
        trainingType: existing.trainingType,
        completedCount: existing.completedCount,
        previousNation: existing.nation,
        previousArea: existing.area,
        previousTrainingType: existing.trainingType,
        previousCompletedCount: existing.completedCount,
      },
    });
    await tx.ministryNationalPartnerInitiative.delete({ where: { id } });
  });
}

import "server-only";

import type { RecruitRecord } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  clampRecruitCounts,
  countRecruitMilestones,
  type RecruitCounts,
} from "@/lib/recruits/recruit-milestones";

/** Newest recruits first, so a freshly added person appears at the top of the admin table. */
export async function listRecruits(): Promise<RecruitRecord[]> {
  return prisma.recruitRecord.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getRecruit(id: string): Promise<RecruitRecord | null> {
  return prisma.recruitRecord.findUnique({ where: { id } });
}

/**
 * Aggregate milestone counts. Returns integers only — no recruit row ever leaves this module,
 * which is what keeps the public tracker free of individual data.
 *
 * Counts people rather than rows, because one record can name a couple ("Jeremy and Lindsay"),
 * so the totals cannot be computed with SQL COUNT alone. Names are read here to weight each
 * record and are discarded immediately. At a 300-person goal the roster is tiny, so reading it
 * in full is cheaper than any weighted-SQL alternative.
 */
export async function getRecruitCounts(): Promise<RecruitCounts> {
  const rows = await prisma.recruitRecord.findMany({
    select: { name: true, jonathanTrainingComplete: true, fullyFunded: true },
  });

  return clampRecruitCounts(countRecruitMilestones(rows));
}

/** Creating a recruit records the Mobilized milestone; both checkboxes start unchecked. */
export async function createRecruit(name: string): Promise<RecruitRecord> {
  return prisma.recruitRecord.create({ data: { name } });
}

export async function renameRecruit(id: string, name: string): Promise<RecruitRecord> {
  return prisma.recruitRecord.update({ where: { id }, data: { name } });
}

export async function updateRecruitMilestones(
  id: string,
  milestones: { jonathanTrainingComplete: boolean; fullyFunded: boolean },
): Promise<RecruitRecord> {
  return prisma.recruitRecord.update({ where: { id }, data: milestones });
}

export async function deleteRecruit(id: string): Promise<void> {
  await prisma.recruitRecord.delete({ where: { id } });
}

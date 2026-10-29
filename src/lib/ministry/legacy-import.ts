/**
 * Plans the legacy import. Planning does not write, and it does not turn a
 * checkbox into a milestone.
 */

import { LEGACY_IMPORT_SOURCES } from "@/lib/ministry/legacy-import-map";

export type LegacyRecruitSnapshot = {
  id: string;
  name: string;
  jonathanTrainingComplete: boolean;
  fullyFunded: boolean;
};

export type PlannedLegacyIndividual = {
  legacyRecruitId: string;
  individualKey: string;
  originalDisplayName: string;
  originalJonathanTraining: boolean;
  originalFullyFunded: boolean;
  displayName: string;
  notes: string;
  shareHousehold: boolean;
  evidence: string;
  mobilized: false;
  trainedEquipped: false;
  sent: false;
};

export type LegacyImportPlan =
  | { ok: true; individuals: PlannedLegacyIndividual[] }
  | { ok: false; error: string; missingSources: string[]; unexpectedRecruits: string[] };

export type ExistingLegacyLink = {
  legacyRecruitId: string;
  individualKey: string;
};

function evidenceFor(recruit: LegacyRecruitSnapshot): string {
  const training = recruit.jonathanTrainingComplete ? "checked" : "not checked";
  const funded = recruit.fullyFunded ? "checked" : "not checked";
  return [
    `Legacy row "${recruit.name}".`,
    `Jonathan Training was ${training}.`,
    `Fully Funded was ${funded}.`,
    "These checkboxes are historical evidence. They are not confirmed milestones.",
  ].join(" ");
}

export function planLegacyImport(recruits: LegacyRecruitSnapshot[]): LegacyImportPlan {
  const byName = new Map<string, LegacyRecruitSnapshot[]>();
  for (const recruit of recruits) {
    const group = byName.get(recruit.name) ?? [];
    group.push(recruit);
    byName.set(recruit.name, group);
  }

  const expected = new Set(LEGACY_IMPORT_SOURCES.map((source) => source.sourceName));
  const missingSources = LEGACY_IMPORT_SOURCES.filter((source) => !byName.has(source.sourceName)).map(
    (source) => source.sourceName,
  );
  const unexpectedRecruits = recruits
    .map((recruit) => recruit.name)
    .filter((name) => !expected.has(name));
  const duplicateNames = [...byName.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([name]) => name);

  if (missingSources.length || unexpectedRecruits.length || duplicateNames.length) {
    return {
      ok: false,
      error: "The legacy roster does not match the reviewed import mapping. Nothing was imported.",
      missingSources: [...missingSources, ...duplicateNames.map((name) => `${name} (duplicate name)`)],
      unexpectedRecruits,
    };
  }

  const individuals: PlannedLegacyIndividual[] = [];
  for (const source of LEGACY_IMPORT_SOURCES) {
    const recruit = byName.get(source.sourceName)?.[0];
    if (!recruit) continue;
    const shareHousehold = source.individuals.length > 1;
    for (const individual of source.individuals) {
      individuals.push({
        legacyRecruitId: recruit.id,
        individualKey: individual.individualKey,
        originalDisplayName: recruit.name,
        originalJonathanTraining: recruit.jonathanTrainingComplete,
        originalFullyFunded: recruit.fullyFunded,
        displayName: individual.displayName,
        notes: individual.notes,
        shareHousehold,
        evidence: evidenceFor(recruit),
        mobilized: false,
        trainedEquipped: false,
        sent: false,
      });
    }
  }

  return { ok: true, individuals };
}

export function importOperations(
  individuals: PlannedLegacyIndividual[],
  existing: ExistingLegacyLink[],
): { create: PlannedLegacyIndividual[]; skip: PlannedLegacyIndividual[] } {
  const present = new Set(existing.map((link) => `${link.legacyRecruitId}:${link.individualKey}`));
  const create: PlannedLegacyIndividual[] = [];
  const skip: PlannedLegacyIndividual[] = [];
  for (const individual of individuals) {
    const key = `${individual.legacyRecruitId}:${individual.individualKey}`;
    if (present.has(key)) skip.push(individual);
    else create.push(individual);
  }
  return { create, skip };
}

/** Names already on ministry_people that this import must not rewrite. */
export function protectedExistingNames(
  existingDisplayNames: string[],
  individuals: PlannedLegacyIndividual[],
): string[] {
  const planned = new Set(individuals.map((individual) => individual.displayName));
  return existingDisplayNames.filter((name) => !planned.has(name));
}

/**
 * Ministry Impact outcomes. Each one is an explicit confirmation on a person.
 *
 * Adding a person does not count as Mobilized. Sent does not require the other two.
 * A person contributes at most one to each total, however many activities they have.
 */

export type MinistryOutcomeInput = {
  mobilized: boolean;
  trainedEquipped: boolean;
  sent: boolean;
};

export type MinistryOutcomeCounts = {
  mobilized: number;
  trainedEquipped: number;
  sent: number;
};

export function countMinistryOutcomes(people: MinistryOutcomeInput[]): MinistryOutcomeCounts {
  let mobilized = 0;
  let trainedEquipped = 0;
  let sent = 0;

  for (const person of people) {
    if (person.mobilized) mobilized += 1;
    if (person.trainedEquipped) trainedEquipped += 1;
    if (person.sent) sent += 1;
  }

  return { mobilized, trainedEquipped, sent };
}

export type MinistryOutcomeBreakdown = {
  individuals: MinistryOutcomeCounts;
  nationalPartnerInitiatives: MinistryOutcomeCounts;
  unified: MinistryOutcomeCounts;
};

/** A saved initiative contributes its completed count to each milestone. */
export function initiativeContribution(completedCount: number): MinistryOutcomeCounts | null {
  if (!Number.isInteger(completedCount) || completedCount < 1) return null;
  return {
    mobilized: completedCount,
    trainedEquipped: completedCount,
    sent: completedCount,
  };
}

/**
 * Anonymous national partner participants. Each initiative adds its completed
 * count once. Audit rows are not an input, so editing replaces the contribution.
 */
export function countNationalPartnerInitiativeOutcomes(
  initiatives: { completedCount: number }[],
): MinistryOutcomeCounts {
  let total = 0;
  for (const initiative of initiatives) {
    const contribution = initiativeContribution(initiative.completedCount);
    if (!contribution) {
      throw new Error("A national partner initiative must have a positive completed count.");
    }
    total += contribution.mobilized;
  }
  return { mobilized: total, trainedEquipped: total, sent: total };
}

/** Verified individuals plus anonymous initiative participants. Does not mutate either input. */
export function combineMinistryOutcomes(
  individuals: MinistryOutcomeCounts,
  nationalPartnerInitiatives: MinistryOutcomeCounts,
): MinistryOutcomeBreakdown {
  return {
    individuals: { ...individuals },
    nationalPartnerInitiatives: { ...nationalPartnerInitiatives },
    unified: {
      mobilized: individuals.mobilized + nationalPartnerInitiatives.mobilized,
      trainedEquipped: individuals.trainedEquipped + nationalPartnerInitiatives.trainedEquipped,
      sent: individuals.sent + nationalPartnerInitiatives.sent,
    },
  };
}

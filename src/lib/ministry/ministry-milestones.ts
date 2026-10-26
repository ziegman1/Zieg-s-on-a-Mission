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

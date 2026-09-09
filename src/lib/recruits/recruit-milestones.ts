/**
 * Derived milestones for the "300 Missionaries Mobilized, Trained & Sent to the Unreached
 * by August 31, 2031" goal.
 *
 * Nothing here is stored. Adding a recruit record *is* the Mobilized event, so Mobilized has no
 * per-record predicate — it is every person on the roster. Counts are by person rather than by
 * row, since one record can name a couple. Each later milestone builds on the one before it, so
 * the progression holds structurally and a stray checkbox cannot invert the public counts:
 *
 *   Sent <= Trained <= Mobilized
 */

import { recruitPersonCount } from "@/lib/recruits/recruit-person-count";

/** The two milestone checkboxes stored on a recruit record. */
export type RecruitMilestoneInput = {
  jonathanTrainingComplete: boolean;
  fullyFunded: boolean;
};

export type RecruitCounts = {
  mobilized: number;
  trained: number;
  sent: number;
};

/** The public goal: 300 Sent by August 31, 2031. */
export const RECRUIT_SENT_GOAL = 300;

/** Trained: Jonathan Training is complete. */
export function isTrained(recruit: RecruitMilestoneInput): boolean {
  return recruit.jonathanTrainingComplete === true;
}

/**
 * Sent: trained and fully funded through a developed prayer and financial partnership team.
 *
 * Fully Funded is an independent checkbox in the admin UI, so this deliberately re-checks
 * training rather than trusting funding alone.
 */
export function isSent(recruit: RecruitMilestoneInput): boolean {
  return isTrained(recruit) && recruit.fullyFunded === true;
}

/**
 * Count milestones over a list of recruits.
 *
 * Counts people, not rows: a record naming a couple contributes two to every milestone it has
 * reached. Records without a name fall back to one person.
 */
export function countRecruitMilestones(
  recruits: (RecruitMilestoneInput & { name?: string })[],
): RecruitCounts {
  let mobilized = 0;
  let trained = 0;
  let sent = 0;

  for (const recruit of recruits) {
    const people = recruit.name ? recruitPersonCount(recruit.name) : 1;
    mobilized += people;
    if (isTrained(recruit)) trained += people;
    if (isSent(recruit)) sent += people;
  }

  return { mobilized, trained, sent };
}

/**
 * Last line of defence for counts that arrive from separate database queries.
 *
 * Clamps negatives to zero and enforces Sent <= Trained <= Mobilized, so the public tracker can
 * never render an impossible progression even if the underlying queries disagree.
 */
export function clampRecruitCounts(counts: RecruitCounts): RecruitCounts {
  const mobilized = Math.max(0, Math.trunc(counts.mobilized));
  const trained = Math.min(mobilized, Math.max(0, Math.trunc(counts.trained)));
  const sent = Math.min(trained, Math.max(0, Math.trunc(counts.sent)));
  return { mobilized, trained, sent };
}

/** Whole-number percentage toward the 300 Sent goal, capped at 100. */
export function sentGoalPercent(sent: number, goal: number = RECRUIT_SENT_GOAL): number {
  const safeGoal = Math.max(1, goal);
  const safeSent = Math.max(0, sent);
  return Math.min(100, Math.round((safeSent / safeGoal) * 100));
}

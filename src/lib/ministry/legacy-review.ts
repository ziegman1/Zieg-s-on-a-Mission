import { z } from "zod";
import {
  countMinistryOutcomes,
  type MinistryOutcomeCounts,
  type MinistryOutcomeInput,
} from "@/lib/ministry/ministry-milestones";

/**
 * Review progress and the proposed verified totals.
 *
 * countMinistryOutcomes remains the only milestone counter. The proposed
 * total passes that same function a list with one known leftover test id removed.
 * It does not look at display names.
 */

/** Leftover row created during the 26 October production check. */
export const LEFTOVER_TEST_PERSON_ID = "8564e8cc-84f5-46cc-99e6-dda76513d7f1";

export const LEFTOVER_TEST_CONFIRMATION = "Remove leftover test record";

export const legacyReviewSchema = z.object({
  reviewStatus: z.enum(["PENDING_REVIEW", "CONFIRMED", "NEEDS_CLARIFICATION"]),
  notes: z.string().trim().max(4000),
});

export type LegacyReviewStatus = z.infer<typeof legacyReviewSchema>["reviewStatus"];

export function reviewProgress(statuses: LegacyReviewStatus[]): { reviewed: number; total: number } {
  return {
    reviewed: statuses.filter((status) => status !== "PENDING_REVIEW").length,
    total: statuses.length,
  };
}

export function reviewProgressLabel(progress: { reviewed: number; total: number }): string {
  return `${progress.reviewed} of ${progress.total} reviewed`;
}

export function proposedVerifiedOutcomes(
  people: (MinistryOutcomeInput & { id: string })[],
): MinistryOutcomeCounts {
  return countMinistryOutcomes(people.filter((person) => person.id !== LEFTOVER_TEST_PERSON_ID));
}

export function leftoverTestRemovalError(id: string, confirmation: string): string | null {
  if (id !== LEFTOVER_TEST_PERSON_ID) {
    return "That record is not the leftover test person.";
  }
  if (confirmation.trim() !== LEFTOVER_TEST_CONFIRMATION) {
    return "Type the confirmation line before removing the test record.";
  }
  return null;
}

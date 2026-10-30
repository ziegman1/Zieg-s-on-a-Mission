import type { MinistryPathway, MinistrySentDesignation } from "@prisma/client";
import { DESIGNATION_LABELS } from "@/lib/ministry/ministry-labels";

export const TEAM_EXPANSION_RECRUIT = "TEAM_EXPANSION_RECRUIT" as const;

export type CalendarDay = string | null;

export type MinistrySaveStored = {
  mobilized: boolean;
  mobilizedOn: CalendarDay;
  trainedEquipped: boolean;
  trainedEquippedOn: CalendarDay;
  sent: boolean;
  sentOn: CalendarDay;
  sentDesignation: MinistrySentDesignation | null;
  sentVerifiedAt: string | null;
  sentVerifiedBy: string;
  sentVerificationNote: string;
  milestoneAudit: string;
};

export type MinistrySaveSubmission = {
  pathway: MinistryPathway | null;
  jonathanTrainingComplete: boolean;
  fullyFunded: boolean;
  mobilized: boolean;
  mobilizedOn: CalendarDay;
  trainedEquipped: boolean;
  trainedEquippedOn: CalendarDay;
  sent: boolean;
  sentOn: CalendarDay;
  sentDesignation: MinistrySentDesignation | null;
  sentVerifiedBy: string;
  sentVerificationNote: string;
  confirmHistoryChange: boolean;
};

export type MinistrySaveWrite = {
  jonathanTrainingComplete: boolean;
  fullyFunded: boolean;
  mobilized: boolean;
  mobilizedOn: CalendarDay;
  trainedEquipped: boolean;
  trainedEquippedOn: CalendarDay;
  sent: boolean;
  sentOn: CalendarDay;
  sentDesignation: MinistrySentDesignation | null;
  sentVerifiedBy: string;
  sentVerificationNote: string;
  clearSentVerifiedAt: boolean;
  touchSentVerifiedAt: boolean;
  milestoneAudit: string;
};

export type MinistrySaveResolution =
  | { ok: true; write: MinistrySaveWrite }
  | { ok: false; error: string; needsConfirmation: boolean };

export class MinistrySaveRejected extends Error {
  readonly needsConfirmation: boolean;

  constructor(message: string, needsConfirmation: boolean) {
    super(message);
    this.name = "MinistrySaveRejected";
    this.needsConfirmation = needsConfirmation;
  }
}

export function initialMilestonesForPathway(pathway: MinistryPathway | null): {
  mobilized: boolean;
  trainedEquipped: boolean;
  sent: boolean;
  jonathanTrainingComplete: boolean;
  fullyFunded: boolean;
} {
  return {
    mobilized: pathway === TEAM_EXPANSION_RECRUIT,
    trainedEquipped: false,
    sent: false,
    jonathanTrainingComplete: false,
    fullyFunded: false,
  };
}

export function teamExpansionOutcomes(progress: {
  jonathanTrainingComplete: boolean;
  fullyFunded: boolean;
}): { mobilized: true; trainedEquipped: boolean; sent: boolean } {
  return {
    mobilized: true,
    trainedEquipped: progress.jonathanTrainingComplete,
    sent: progress.jonathanTrainingComplete && progress.fullyFunded,
  };
}

/** Compares the saved milestone flags with the progression the open form would save. */
export function teamExpansionProgressDiscrepancy(
  stored: { mobilized: boolean; trainedEquipped: boolean; sent: boolean },
  progress: { jonathanTrainingComplete: boolean; fullyFunded: boolean },
): string | null {
  const next = teamExpansionOutcomes(progress);
  const parts: string[] = [];
  if (stored.mobilized !== next.mobilized) {
    parts.push("Mobilized is not saved yet. Saving records it.");
  }
  if (stored.trainedEquipped !== next.trainedEquipped) {
    parts.push(
      next.trainedEquipped
        ? "Trained & Equipped is not saved yet. Jonathan Training Complete will record it."
        : "Trained & Equipped is saved, but Jonathan Training Complete is unchecked. Saving turns that milestone off and keeps any recorded date.",
    );
  }
  if (stored.sent !== next.sent) {
    parts.push(
      next.sent
        ? "Sent is not saved yet. Both prerequisites record it after a designation is chosen."
        : "Sent is saved, but Jonathan Training Complete and Fully Funded are not both checked. Saving turns Sent off, keeps the recorded date and verification, and adds the previous designation to the milestone history.",
    );
  }
  if (parts.length === 0) return null;
  return `Saved milestones differ from Team Expansion Recruit progression. ${parts.join(" ")}`;
}

function keepDay(submitted: CalendarDay, stored: CalendarDay): CalendarDay {
  return submitted || stored;
}

function appendAudit(existing: string, lines: string[]): string {
  if (lines.length === 0) return existing;
  const block = lines.join("\n");
  return existing.trim() ? `${existing.trim()}\n${block}` : block;
}

function designationLabel(value: MinistrySentDesignation | null): string {
  return value ? DESIGNATION_LABELS[value] : "none";
}

/**
 * Resolve one explicit person save.
 * Team Expansion Recruit progression is applied only when the submitted pathway is that pathway.
 * Legacy checkbox evidence is not an input and cannot be copied from here.
 */
export function resolveMinistryPersonSave(
  stored: MinistrySaveStored,
  submission: MinistrySaveSubmission,
  recordedOn: string,
): MinistrySaveResolution {
  const jonathanTrainingComplete = submission.jonathanTrainingComplete;
  const fullyFunded = submission.fullyFunded;

  if (submission.pathway !== TEAM_EXPANSION_RECRUIT) {
    if (submission.sent && !submission.sentDesignation) {
      return { ok: false, error: "Choose a Sent designation", needsConfirmation: false };
    }
    const verifier = submission.sent ? submission.sentVerifiedBy.trim() : "";
    return {
      ok: true,
      write: {
        jonathanTrainingComplete,
        fullyFunded,
        mobilized: submission.mobilized,
        mobilizedOn: submission.mobilized ? submission.mobilizedOn : null,
        trainedEquipped: submission.trainedEquipped,
        trainedEquippedOn: submission.trainedEquipped ? submission.trainedEquippedOn : null,
        sent: submission.sent,
        sentOn: submission.sent ? submission.sentOn : null,
        sentDesignation: submission.sent ? submission.sentDesignation : null,
        sentVerifiedBy: verifier,
        sentVerificationNote: submission.sent ? submission.sentVerificationNote.trim() : "",
        clearSentVerifiedAt: !submission.sent || !verifier,
        touchSentVerifiedAt: submission.sent && Boolean(verifier),
        milestoneAudit: stored.milestoneAudit,
      },
    };
  }

  const outcomes = teamExpansionOutcomes({ jonathanTrainingComplete, fullyFunded });
  if (outcomes.sent && !submission.sentDesignation) {
    return {
      ok: false,
      error: "Choose a Sent designation",
      needsConfirmation: false,
    };
  }

  const sentTurningOff = stored.sent && !outcomes.sent;
  const trainedTurningOff =
    stored.trainedEquipped && !outcomes.trainedEquipped && Boolean(stored.trainedEquippedOn);

  if ((sentTurningOff || trainedTurningOff) && !submission.confirmHistoryChange) {
    const parts: string[] = [];
    if (sentTurningOff) {
      parts.push(
        "Saving will turn Sent off because Jonathan Training Complete and Fully Funded are not both confirmed. The recorded Sent date and verification stay on this person. The previous designation is added to the milestone history.",
      );
    }
    if (trainedTurningOff) {
      parts.push(
        "Saving will turn Trained & Equipped off because Jonathan Training Complete is unchecked. The recorded training date stays on this person.",
      );
    }
    return {
      ok: false,
      error: parts.join(" "),
      needsConfirmation: true,
    };
  }

  const auditLines: string[] = [];
  if (sentTurningOff) {
    auditLines.push(
      `${recordedOn} Sent turned off for Team Expansion Recruit because Jonathan Training Complete and Fully Funded were not both confirmed. Previous designation: ${designationLabel(stored.sentDesignation)}. Sent date kept: ${stored.sentOn ?? "none"}. Verification kept: ${stored.sentVerifiedBy.trim() || "none"}.`,
    );
  }
  if (trainedTurningOff) {
    auditLines.push(
      `${recordedOn} Trained & Equipped turned off because Jonathan Training Complete was unchecked. Training date kept: ${stored.trainedEquippedOn}.`,
    );
  }

  const verifier = outcomes.sent ? submission.sentVerifiedBy.trim() : stored.sentVerifiedBy.trim();
  return {
    ok: true,
    write: {
      jonathanTrainingComplete,
      fullyFunded,
      mobilized: true,
      mobilizedOn: keepDay(submission.mobilizedOn, stored.mobilizedOn),
      trainedEquipped: outcomes.trainedEquipped,
      trainedEquippedOn: keepDay(submission.trainedEquippedOn, stored.trainedEquippedOn),
      sent: outcomes.sent,
      sentOn: keepDay(submission.sentOn, stored.sentOn),
      sentDesignation: outcomes.sent ? submission.sentDesignation : null,
      sentVerifiedBy: verifier,
      sentVerificationNote: outcomes.sent
        ? submission.sentVerificationNote.trim()
        : stored.sentVerificationNote,
      clearSentVerifiedAt: false,
      touchSentVerifiedAt: outcomes.sent && Boolean(submission.sentVerifiedBy.trim()),
      milestoneAudit: appendAudit(stored.milestoneAudit, auditLines),
    },
  };
}

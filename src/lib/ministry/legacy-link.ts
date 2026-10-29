import type { MinistryPathway, MinistrySentDesignation } from "@prisma/client";
import type { LegacyReviewStatus } from "@/lib/ministry/legacy-review";

export type LegacyLinkView = {
  id: string;
  individualKey: string;
  legacyRecruitId: string;
  originalDisplayName: string;
  originalJonathanTraining: boolean;
  originalFullyFunded: boolean;
  evidence: string;
  reviewStatus: LegacyReviewStatus;
  reviewedAt: string | null;
  reviewedBy: string;
  notes: string;
  person: {
    id: string;
    displayName: string;
    pathway: MinistryPathway | null;
    householdId: string | null;
    mobilized: boolean;
    mobilizedOn: string | null;
    trainedEquipped: boolean;
    trainedEquippedOn: string | null;
    sent: boolean;
    sentOn: string | null;
    sentDesignation: MinistrySentDesignation | null;
    sentVerifiedBy: string;
    sentVerificationNote: string;
  };
};

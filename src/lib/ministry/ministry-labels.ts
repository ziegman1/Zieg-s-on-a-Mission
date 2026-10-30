import type {
  MinistryActivityStatus,
  MinistryActivityType,
  MinistryPathway,
  MinistrySentDesignation,
} from "@prisma/client";

export const PATHWAY_LABELS: Record<MinistryPathway, string> = {
  TEAM_EXPANSION_RECRUIT: "Team Expansion Recruits",
  NATIONAL_PARTNER: "National Partners",
  TRAINING_PARTICIPANT: "Training Participants",
};

export const PATHWAY_GUIDANCE: Record<MinistryPathway, string> = {
  TEAM_EXPANSION_RECRUIT:
    "Mobilized is recorded when this pathway is saved. Trained & Equipped follows Jonathan Training Complete. Sent follows Jonathan Training Complete and Fully Funded together, and then requires a designation. Fully Funded can be recorded before training. The pathway does not assume Overseas Missionary.",
  NATIONAL_PARTNER:
    "Sent means they finished the applicable medical training or Jonathan Training (DMM) and were released to use it among the unreached.",
  TRAINING_PARTICIPANT:
    "Sent means they reported putting the training into practice with a focus on reaching the unreached. Finishing Fidelis is not Sent. Fidelis Sent criteria are not defined yet, so leave Sent unset for Fidelis until those criteria are decided.",
};

export const DESIGNATION_LABELS: Record<MinistrySentDesignation, string> = {
  OVERSEAS_MISSIONARY: "Overseas Missionary",
  INTERNATIONAL_SERVICES: "International Services",
  D_COURSE: "D-Course",
  NATIONAL_WORKER: "National Worker",
  OTHER_DISCIPLE_MAKER: "Other Disciple-Maker",
};

export const ACTIVITY_LABELS: Record<MinistryActivityType, string> = {
  JONATHAN_TRAINING: "Jonathan Training (DMM)",
  MEDICAL_TRAINING: "Medical Training",
  SUPPORT_RAISING_COACHING: "Support Raising / Coaching",
  D_COURSE: "D-Course",
  ZUME: "Zúme",
  FOUR_FIELDS_ONLINE: "Four Fields Online",
  FIDELIS: "Fidelis",
  LAUNCH: "Launch",
  OTHER: "Other",
};

export const ACTIVITY_STATUS_LABELS: Record<MinistryActivityStatus, string> = {
  PARTICIPATED: "Participated",
  COMPLETED: "Completed",
};

export const UNSET_PATHWAY_GUIDANCE =
  "Pathway is still unset. Choose one to see how Sent is qualified for that path. Sent is never inferred from funding or from finishing an activity.";

/** Client-side roster filter. Blank query matches everyone. */
export function ministryPersonMatchesQuery(
  person: {
    displayName: string;
    pathway: MinistryPathway | null;
    notes: string;
    activities?: { activityType: MinistryActivityType; location: string }[];
  },
  query: string,
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    person.displayName,
    person.pathway ? PATHWAY_LABELS[person.pathway] : "",
    person.notes,
    ...(person.activities ?? []).flatMap((activity) => [
      ACTIVITY_LABELS[activity.activityType],
      activity.location,
    ]),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

/**
 * Default public copy and ministry-function structure for /ministry-funding.
 *
 * Function taxonomy matches the PD Coaching OS Ministry Allocation starter set.
 * Allocation amounts are Site Builder–editable and start empty (no fabricated figures).
 * Future PD Coaching OS imports should map into this shape (see transfer schema types).
 */

export const MINISTRY_FUNDING_META = {
  title: "Ministry Funding & Partnership",
  description:
    "See our financial partnership goals and how partnership sustains the ministry functions that mobilize, train, and send workers for the sake of reaching the unreached.",
} as const;

export const MINISTRY_FUNDING_HERO = {
  title: "FUELING THE MISSION.",
  supporting: "Investing in Workers. Advancing the Gospel.",
  body: "Every worker mobilized, every person equipped, and every step toward reaching the unreached is made possible through faithful partnership.",
} as const;

export const MINISTRY_FUNDING_GOALS = {
  title: "Our Financial Partnership Goal",
  awaitingCopy:
    "Updated partnership figures will appear here once they are published. Thank you for standing with us as we pursue the work.",
  progressLabel: "Recurring funding goal achieved",
  updatedLabel: "Figures last updated",
} as const;

export const MINISTRY_FUNDING_FUNCTIONS_HEADING = "How Your Partnership Supports the Mission";

export const MINISTRY_FUNDING_CHART = {
  title: "Estimated Ministry Investment by Function",
  explanation:
    "These figures illustrate how ministry expenses are allocated across our seven areas of service. Direct expenses are assigned to their respective functions, while shared expenses are distributed according to recorded ministry time. Team Expansion Mission Share is included in Ministry Operations & Stewardship.",
  distinction:
    "This chart shows estimated ministry expense allocation. It is not a report of how individual donations were designated, and it is separate from our recurring financial partnership income progress above.",
  awaitingCopy:
    "Ministry function descriptions are shown below. A numerical investment chart will appear once a reconciled allocation for the reporting period is published.",
} as const;

/** Prior explanation strings replaced by migration when still present in saved CMS content. */
export const MINISTRY_FUNDING_CHART_EXPLANATION_LEGACY = [
  "These figures represent an allocation of ministry expenses across our areas of service. Shared expenses are distributed according to recorded ministry time, while direct expenses are assigned to their respective functions.",
  "These figures represent an allocation of ministry expenses across our areas of service. Shared ministry expenses may be distributed according to recorded ministry time, while direct expenses are assigned to their respective functions.",
] as const;

export const MINISTRY_FUNDING_INVITATION = {
  title: "YOUR PARTNERSHIP MAKES THIS POSSIBLE.",
  body: "Join us as we mobilize, train, and send 300 more workers by August 31, 2031, for the sake of reaching the unreached.",
  primaryCtaLabel: "Become a Financial Partner",
  primaryCtaUrl: "/give",
} as const;

export type MinistryFundingProgram = {
  name: string;
};

export type MinistryFundingFunctionDef = {
  id: string;
  name: string;
  /** Visitor-facing explanation of how partnership supports this function. */
  description: string;
  programs: readonly MinistryFundingProgram[];
  /** Default chart color (brand-adjacent; editable in Site Builder). */
  defaultColor: string;
};

/**
 * Seven ministry functions from the PD Coaching OS starter taxonomy.
 * Descriptions are public-facing; they are not live household allocation data.
 */
export const MINISTRY_FUNDING_FUNCTIONS: readonly MinistryFundingFunctionDef[] = [
  {
    id: "mobilization",
    name: "Mobilization",
    description:
      "Helping believers recognize their place in God’s mission and take meaningful next steps—whether exploring volunteer service, answering a call to go, or finding their role in sending.",
    programs: [{ name: "AWL-IN Volunteerism" }, { name: "General Mobilization" }],
    defaultColor: "#83b0da",
  },
  {
    id: "training-equipping",
    name: "Training & Equipping",
    description:
      "Preparing people with biblical understanding, practical skills, and ministry strategies so they can make disciples and contribute to reaching those who have yet to hear.",
    programs: [
      { name: "Jonathan Training" },
      { name: "Partnership Development / Launch Training" },
      { name: "Medical Access & Entry Strategy Training" },
    ],
    defaultColor: "#edb73e",
  },
  {
    id: "coaching-development",
    name: "Coaching & Development",
    description:
      "Walking alongside workers and leaders through coaching that strengthens partnership development, disciple-making practice, advisory teams, and the trainers who multiply others.",
    programs: [
      { name: "Partnership Development Coaching" },
      { name: "Advisory Team Development" },
      { name: "Disciple-Making Coaching" },
      { name: "Disciple-Making Trainer Development" },
    ],
    defaultColor: "#1e3644",
  },
  {
    id: "leadership-education",
    name: "Leadership Development & Education",
    description:
      "Forming catalytic leaders through immersive cross-cultural training and educational pathways that deepen character, skill, and long-term fruitfulness.",
    programs: [{ name: "D-Course" }, { name: "Fidelis" }],
    defaultColor: "#5a8fbf",
  },
  {
    id: "disciple-making",
    name: "Disciple-Making & Church Multiplication",
    description:
      "Supporting disciple-making and church multiplication where we live and through partnerships—so some begin right where they are while others are prepared to go farther.",
    programs: [
      { name: "Apartment Community Disciple-Making / Church Planting" },
      { name: "Local Church Multiplication Partnership" },
    ],
    defaultColor: "#c4922e",
  },
  {
    id: "partnership-development",
    name: "Partnership Development & Support Raising",
    description:
      "Building the prayer and financial partnerships that sustain workers—through personal and church relationships, partner care, and clear ministry communication.",
    programs: [
      { name: "Individual Partnership Development" },
      { name: "Church Partnership Development" },
      { name: "Partner Care & Stewardship" },
      { name: "Partnership Communications" },
    ],
    defaultColor: "#4a6b82",
  },
  {
    id: "operations-stewardship",
    name: "Ministry Operations & Stewardship",
    description:
      "Stewarding the practical work that keeps ministry healthy: administration, organizational responsibilities, and the shared infrastructure that supports every function.",
    programs: [
      { name: "Team Expansion Mission Share" },
      { name: "General Ministry Operations" },
      { name: "Ministry-Wide Administration" },
      { name: "Organizational Responsibilities" },
    ],
    defaultColor: "#8a9eae",
  },
] as const;

/**
 * Mission Share remains a distinct line in the PD Coaching OS source snapshot.
 * For public chart presentation it is folded into Ministry Operations & Stewardship
 * (see chart-presentation.ts) — never shown as an 8th slice.
 */
export const MISSION_SHARE_CATEGORY = {
  id: "mission-share",
  name: "Team Expansion Mission Share",
  description:
    "A designated organizational share supporting Team Expansion. On the public ministry investment chart it is included in Ministry Operations & Stewardship.",
  defaultColor: "#6b7280",
} as const;

/** @deprecated Prefer ZOAM_MINISTRY_ALLOCATION_SCHEMA from zoam-schema.ts */
export const MINISTRY_FUNDING_TRANSFER_SCHEMA_VERSION = "zoam-ministry-allocation/v1" as const;

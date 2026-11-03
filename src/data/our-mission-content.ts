/**
 * Default public copy for /our-mission (Ministry Impact Framework).
 *
 * Used to seed Site Builder sections. Saved Site Builder content takes precedence.
 * Milestone qualification logic and live tracker totals stay in code / ministry records —
 * editing page copy does not change calculations.
 */

export const OUR_MISSION_META = {
  title: "Our Mission",
  description:
    "Our vision is to see God mobilize, train, and send 300 more workers by August 31, 2031, for the sake of reaching the unreached.",
} as const;

const OUR_MISSION_HERO_VISION =
  "Our vision is to see God mobilize, train, and send 300 more workers by August 31, 2031, for the sake of reaching the unreached.";

const OUR_MISSION_HERO_DETAIL =
  "Some workers go directly to unreached peoples. Others equip and support those who go, while still others begin putting disciple-making principles into practice where they are. Each contributes to the ultimate purpose of seeing the Gospel reach those who have yet to hear.";

export const OUR_MISSION_HERO = {
  title: "MOBILIZE. TRAIN. SEND.",
  supporting: "For the Sake of Reaching the Unreached.",
  /** Short vision line shown in the compact above-the-fold hero. */
  vision: OUR_MISSION_HERO_VISION,
  /** Longer explanation shown beneath the above-the-fold band. */
  detail: OUR_MISSION_HERO_DETAIL,
  /** Both paragraphs — prefer vision + detail for layout. */
  paragraphs: [OUR_MISSION_HERO_VISION, OUR_MISSION_HERO_DETAIL],
} as const;

export const OUR_MISSION_FUNCTIONS_TITLE = "What Does It Mean to Mobilize, Train & Send?";

export const OUR_MISSION_FUNCTIONS = [
  {
    id: "mobilize",
    title: "Mobilize",
    subtitle: "From Awareness to Commissioning",
    paragraphs: [
      "Mobilization is the intentional process of helping individuals recognize their role in God's mission and guiding them toward participation in the Great Commission.",
      "It begins with raising awareness and personal engagement, continues through meaningful commitments and training, and culminates in commissioning.",
      "For tracking purposes, an individual reaches the Mobilized milestone when they complete the qualifying step established for their ministry avenue. The broader mobilization process continues beyond that initial milestone.",
    ],
  },
  {
    id: "train",
    title: "Train & Equip",
    subtitle: "From Willingness to Readiness",
    paragraphs: [
      "Training and equipping prepare individuals with the biblical understanding, practical skills, ministry strategies, and preparation necessary to participate in making disciples.",
      "Training differs according to the ministry avenue, but the shared objective is to prepare people for intentional ministry involvement.",
      "An individual reaches the Trained & Equipped milestone upon successfully completing the qualifying training and its required concluding activities.",
    ],
  },
  {
    id: "send",
    title: "Send",
    subtitle: "From Preparation to Commissioned Participation",
    paragraphs: [
      "Sending marks the successful completion of the preparation and sending requirements established for a particular ministry avenue.",
      "For some participants, this occurs through commissioning or graduation. For Team Expansion missionary recruits and AWL-IN volunteers, it occurs upon completion of their partnership development requirements.",
      "Being counted as Sent does not necessarily mean an individual has physically relocated, begun their assignment, or demonstrated subsequent ministry outcomes.",
    ],
  },
] as const;

export type OurMissionQualification = {
  label: "Mobilized" | "Trained & Equipped" | "Sent";
  text: string;
};

export type OurMissionTrack = {
  title: string | null;
  qualifications: readonly OurMissionQualification[];
  notes: readonly string[];
};

export type OurMissionAvenue = {
  id: string;
  title: string;
  summary: string;
  paragraphs: readonly string[];
  tracks: readonly OurMissionTrack[];
};

export const OUR_MISSION_AVENUES_TITLE = "Three Avenues. One Mission.";

export const OUR_MISSION_AVENUES: readonly OurMissionAvenue[] = [
  {
    id: "jonathan-training",
    title: "Jonathan Training",
    summary: "Equipping believers to make disciples who make disciples.",
    paragraphs: [
      "Through awareness, personal conversations, and training opportunities, we help believers recognize their role in the Great Commission.",
      "Jonathan Training equips participants with practical disciple-making strategies and concludes with the development of a three-month implementation plan and a commissioning to put their training into practice.",
    ],
    tracks: [
      {
        title: null,
        qualifications: [
          {
            label: "Mobilized",
            text: "Registers for Jonathan Training or its recognized equivalent.",
          },
          {
            label: "Trained & Equipped",
            text: "Completes Jonathan Training, including the three-month implementation plan and commissioning.",
          },
          {
            label: "Sent",
            text: "Participates in the concluding commissioning.",
          },
        ],
        notes: [
          "The training's conclusion fulfills both the Trained & Equipped and Sent milestones.",
        ],
      },
    ],
  },
  {
    id: "team-expansion",
    title: "Team Expansion Missionaries & AWL-IN Volunteers",
    summary: "Preparing workers for sustainable missionary service.",
    paragraphs: [
      "We help individuals explore opportunities for missionary service through missions events, personal conversations, and Launch training.",
      "Once individuals become approved missionary recruits, we continue equipping them through Jonathan Training and partnership development coaching.",
      "Our partnership development work helps recruits establish the financial and prayer partnerships necessary for sustainable ministry.",
    ],
    tracks: [
      {
        title: null,
        qualifications: [
          {
            label: "Mobilized",
            text: "Completes Launch, submits an application, receives approval, and is officially upgraded to missionary recruit status.",
          },
          {
            label: "Trained & Equipped",
            text: "Completes Jonathan Training, including the three-month implementation plan and commissioning.",
          },
          {
            label: "Sent",
            text: "Reaches at least 100% of the required financial support goal, reaches at least 100% of the prayer partner goal, and submits the one-page Support Raising Journey reflection paper.",
          },
        ],
        notes: [
          "All three partnership development requirements must be satisfied for Sent.",
          "The Sent milestone represents the completion of the partnership development responsibilities within our ministry, not necessarily physical deployment.",
          "AWL-IN volunteers follow the same milestone requirements as Team Expansion missionary recruits.",
        ],
      },
    ],
  },
  {
    id: "national-partners",
    title: "Outside Catalysts & National Partners",
    summary: "Equipping national believers through established ministry partnerships.",
    paragraphs: [
      "Working through partnerships initiated by others within Team Expansion, we help equip participants for ministry through Jonathan/Four Fields disciple-making training or medical training.",
      "Our role is to contribute training and equipping within these established partnerships, helping prepare participants for the sake of reaching the unreached.",
    ],
    tracks: [
      {
        title: "Jonathan / Four Fields Training",
        qualifications: [
          { label: "Mobilized", text: "Participates in the training opportunity." },
          {
            label: "Trained & Equipped",
            text: "Completes the training, including the three-month implementation plan.",
          },
          { label: "Sent", text: "Participates in the concluding commissioning." },
        ],
        notes: [],
      },
      {
        title: "Medical Training",
        qualifications: [
          { label: "Mobilized", text: "Participates in the medical training opportunity." },
          { label: "Trained & Equipped", text: "Completes the medical training." },
          {
            label: "Sent",
            text: "Participates in graduation, which serves as commissioning and sending.",
          },
        ],
        notes: [],
      },
    ],
  },
];

export const OUR_MISSION_BEYOND = {
  title: "Commissioning Isn't the End of the Story.",
  paragraphs: [
    "Our involvement doesn't necessarily end when someone completes training or is commissioned.",
    "Through continued coaching, accountability, and encouragement, we seek to walk alongside participants as they put their training into practice and pursue the commitments they have made.",
    "While subsequent implementation is not a requirement for reaching the Sent milestone, helping people follow through on their commitments remains an important part of our ministry.",
  ],
} as const;

export const OUR_MISSION_MEASUREMENT = {
  title: "How We Measure Our Progress",
  intro:
    "The Ministry Impact Tracker counts people who have reached the qualifying milestones in these three avenues.",
  points: [
    "Each milestone has a defined qualification.",
    "Milestones are cumulative. Later milestones include the preparation that came before them.",
    "A person we can identify is counted once for each milestone they have reached.",
    "Completed national partner trainings add their reviewed participant totals. Those participants are not named, and the same safeguards used for those records stay in place.",
    "Commissioning or graduation can count as Sent.",
    "Sent does not necessarily mean someone has physically relocated or begun an assignment.",
    "The tracker measures the outcomes of our ministry responsibilities, not every subsequent result of the workers' ministries.",
  ],
} as const;

export const OUR_MISSION_INVITATION = {
  title: "The Harvest Is Plentiful. The Workers Are Few.",
  paragraphs: [
    "God continues to raise up people to participate in His mission. Some will go, others will equip and support those who go, and still others will begin making disciples where they are.",
    "Together, we are working for the sake of reaching the unreached.",
  ],
} as const;

/** Single closing CTA under the Harvest invitation — informational, not direct giving. */
export const OUR_MISSION_CLOSING_CTA = {
  href: "/ministry-funding",
  label: "See How You Can Make a Difference",
} as const;

/** @deprecated Prefer OUR_MISSION_CLOSING_CTA — kept as a one-item list for callers. */
export const OUR_MISSION_CTAS = [OUR_MISSION_CLOSING_CTA] as const;

/** Legacy closing buttons replaced by the single Ministry Funding CTA. */
export const OUR_MISSION_CTA_LEGACY = {
  primaryLabel: "Partner With Us",
  secondaryLabel: "Explore Opportunities to Serve",
  secondaryUrl: "/contact",
} as const;

export const SUPPORT_RAISING_JOURNEY = "Support Raising Journey";

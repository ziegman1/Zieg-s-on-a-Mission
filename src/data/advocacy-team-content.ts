/**
 * Advocacy Team Member page copy and downloadable resource links.
 *
 * Update resource `href` values when PDFs are ready — place files under
 * `public/resources/` (e.g. `/resources/ministry-one-pager.pdf`).
 */

export type AdvocacyTeamResource = {
  id: string;
  title: string;
  description: string;
  /** Replace `#` or paths below with final PDF URLs under `/resources/`. */
  href: string;
};

export const ADVOCACY_TEAM_CONTACT_HREF = "/contact";
export const ADVOCACY_TEAM_RESOURCES_SECTION_ID = "advocacy-team-resources";

export const ADVOCACY_TEAM_META = {
  title: "Advocacy Team Member | Zieg's on a Mission",
  description:
    "Learn how to serve as a Zieg's on a Mission Advocacy Team Member through prayer, relationships, advocacy, and strategic support.",
};

export const ADVOCACY_TEAM_HERO = {
  eyebrow: "Serve with us",
  title: "Advocacy Team Member",
  subtitle: "Help advance the mission through prayer, relationships, and strategic support.",
  primaryCtaLabel: "Contact Us About the Advocacy Team",
  secondaryCtaLabel: "Download Resources",
};

export const ADVOCACY_TEAM_INTRO = {
  heading: "What is an Advocacy Team Member?",
  paragraphs: [
    "An Advocacy Team Member is a trusted ministry partner who helps advance the work of Zieg's on a Mission through prayer, relationships, and strategic support. This is an invitation to walk alongside us — not a corporate job posting or a formal board appointment.",
    "Advocacy Team Members are not a governing board, oversight committee, or decision-making body for the ministry. Instead, they serve as advocates, ambassadors, and ministry partners who extend the mission into their own circles of influence.",
    "You bring your relationships, your voice, and your heart for the gospel. We provide direction, resources, and ongoing communication so you can represent the mission faithfully and relationally.",
  ],
};

export const ADVOCACY_TEAM_MISSION = {
  heading: "Our mission",
  statement:
    "To mobilize ordinary believers to participate in God's mission by making disciples, multiplying leaders, strengthening churches, and helping bring the gospel to those who have little or no access to it.",
};

export type AdvocacyTeamRole = {
  id: string;
  title: string;
  summary: string;
  bullets: string[];
};

export const ADVOCACY_TEAM_ROLES: AdvocacyTeamRole[] = [
  {
    id: "pray",
    title: "Pray",
    summary: "Cover the ministry, the team, and the harvest field in consistent, faith-filled prayer.",
    bullets: [
      "Pray for open doors, wisdom, and protection for the Zieg family and ministry partners.",
      "Intercede for unreached peoples and new communities of faith where the gospel is taking root.",
      "Pray during active campaigns for clarity, provision, and the right partners at the right time.",
      "Lift up other Advocacy Team Members and the growing community of ministry partners.",
    ],
  },
  {
    id: "advocate",
    title: "Advocate",
    summary: "Represent the mission with integrity — sharing the vision where you live, work, and worship.",
    bullets: [
      "Tell the story of what God is doing through Zieg's on a Mission with warmth and accuracy.",
      "Answer questions honestly and point people to ministry resources when helpful.",
      "Speak on behalf of the mission when invited — in small groups, churches, or informal settings.",
      "Help others understand that partnership is relational mission, not a transaction.",
    ],
  },
  {
    id: "connect",
    title: "Connect",
    summary: "Open relational doors by introducing people, churches, and communities to the mission.",
    bullets: [
      "Introduce friends, family, or colleagues who may be interested in prayer or partnership.",
      "Connect pastors, leaders, or small groups who want to learn more about the work.",
      "Identify businesses, churches, or networks where advocacy conversations may be natural.",
      "Help potential partners take a next step — a conversation, visit, gift, or prayer commitment.",
    ],
  },
  {
    id: "mobilize",
    title: "Mobilize",
    summary: "Help expand the community of partners who pray, give, and go alongside the mission.",
    bullets: [
      "Invite others to explore monthly partnership, one-time giving, or Mission Hub community.",
      "Share campaign updates and opportunities during active fundraising seasons.",
      "Encourage others to participate through prayer, giving, or serving in their own context.",
      "Champion the mission locally so more ordinary believers can step into God's global work.",
    ],
  },
];

export const ADVOCACY_TEAM_PARTNERSHIP_GOAL = {
  heading: "Partnership Goal Commitment",
  intro:
    "Each Advocacy Team Member is invited to consider a Partnership Goal Commitment — a shared target that helps us grow the community of partners supporting the mission. This is not a quota, obligation, or performance metric. You are not expected to fund the mission alone.",
  emphasis:
    "The goal is to help build a growing community of prayer and financial partners who walk with us over time. Your role is to multiply connection and invitation — we celebrate every step of faith, large or small.",
  examplesHeading: "Ways the commitment can be fulfilled",
  examples: [
    "Personal giving as the Lord leads",
    "Securing new monthly or one-time partners",
    "Warm introductions to individuals, families, or leaders",
    "Church or business connections and presentations",
    "Hosting informal gatherings or coffee conversations",
    "Speaking opportunities in your church, small group, or network",
    "Promoting campaign initiatives and ministry updates in your circles",
  ],
};

export const ADVOCACY_TEAM_TIME = {
  heading: "Time commitment",
  duringCampaigns: {
    title: "During active campaigns",
    items: [
      "Regular prayer for campaign goals and new partner connections",
      "Participation in campaign events, calls, or gatherings when possible",
      "Sharing ministry updates with your network in a relational, non-pressure way",
      "Periodic check-ins with ministry leadership for encouragement and alignment",
      "Helping identify and steward potential partners the Lord puts on your heart",
    ],
  },
  betweenCampaigns: {
    title: "Between campaigns",
    items: [
      "Ongoing prayer for the team, the field, and partner relationships",
      "Staying informed through ministry updates and Mission Hub when helpful",
      "Light relational follow-up with partners or contacts you have connected",
      "Being available for occasional introductions or speaking as opportunities arise",
      "Rest and sustainability — advocacy is a marathon, not a sprint",
    ],
  },
};

export const ADVOCACY_TEAM_QUALIFICATIONS = {
  heading: "Qualifications",
  items: [
    "A personal relationship with Jesus Christ and a desire to see the gospel advance",
    "Alignment with the mission, values, and direction of Zieg's on a Mission",
    "A reputation for integrity, discretion, and Christlike character",
    "Willingness to pray consistently for the ministry and unreached peoples",
    "Ability to communicate the mission clearly, warmly, and without hype or pressure",
    "Existing relationships — church, workplace, community — where advocacy can occur naturally",
    "Commitment to represent the ministry honorably in word and action",
  ],
};

export const ADVOCACY_TEAM_BENEFITS = {
  heading: "Benefits of serving",
  items: [
    "A deeper sense of partnership in gospel advance beyond financial giving alone",
    "Regular prayer updates and front-row perspective on what God is doing",
    "Connection with other Advocacy Team Members who share the same heart for mission",
    "Advocacy resources, training materials, and campaign tools as they are available",
    "Direct communication with ministry leadership during active seasons",
    "The joy of seeing lives and partnerships changed through your invitations and prayer",
    "A meaningful way to use your influence for eternal purpose",
  ],
};

export const ADVOCACY_TEAM_OUR_COMMITMENT = {
  heading: "Our commitment to you",
  intro:
    "We do not take your yes lightly. Serving as an Advocacy Team Member is a partnership — and we commit to honoring your time, your relationships, and your calling.",
  items: [
    "Clear communication about expectations, campaigns, and ministry direction",
    "Timely prayer updates, stories, and resources you can share with confidence",
    "Training and advocacy materials so you never have to invent the message on your own",
    "Gratitude and respect — you are a valued ministry partner, not a means to an end",
    "Responsive support from leadership when you have questions or need guidance",
    "Realistic pacing that honors your family, work, and local church commitments",
  ],
};

/** Replace `href` values when PDFs are uploaded to `public/resources/`. */
export const ADVOCACY_TEAM_RESOURCES: AdvocacyTeamResource[] = [
  {
    id: "one-pager",
    title: "Ministry One-Pager",
    description: "A concise overview of Zieg's on a Mission for sharing in conversations and meetings.",
    href: "/resources/ministry-one-pager.pdf",
  },
  {
    id: "case-document",
    title: "Ministry Case Document",
    description: "A fuller picture of the mission, vision, and partnership opportunity.",
    href: "/resources/ministry-case-document.pdf",
  },
  {
    id: "giving-info",
    title: "Giving Information",
    description: "How to give, partnership levels, and tax-deductible giving details.",
    href: "/resources/giving-information.pdf",
  },
  {
    id: "prayer-guide",
    title: "Prayer Guide",
    description: "Specific prayer points for the team, the field, and unreached peoples.",
    href: "/resources/prayer-guide.pdf",
  },
  {
    id: "overview",
    title: "Advocacy Team Overview",
    description: "A printable summary of the Advocacy Team Member role and expectations.",
    href: "/resources/advocacy-team-overview.pdf",
  },
];

export const ADVOCACY_TEAM_FINAL_CTA = {
  heading: "Interested in serving?",
  body: "If you would like to explore serving as a Zieg's on a Mission Advocacy Team Member, we would love to connect with you.",
  buttonLabel: "Contact Us About the Advocacy Team",
};

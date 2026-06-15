/**
 * Temporary support campaign — adjust goal, levels, and giving URL here.
 * Remove this file and related routes when the campaign ends.
 */

/** Monthly partnership goal for this campaign (USD). */
export const CAMPAIGN_GOAL = 2000;

/** Clickable monthly pledge levels shown on the campaign page. */
export const PARTNERSHIP_LEVELS = [25, 50, 100, 150, 200, 250] as const;

export type PartnershipLevel = (typeof PARTNERSHIP_LEVELS)[number];

/** Aplos monthly giving page for Jeremy & Lindsay Ziegenhorn. */
export const CAMPAIGN_GIVING_URL =
  "https://app.aplos.com/aws/give/TeamExpansion/jeremylindsayZiegenhorn";

/** localStorage key for visitor-side pledge interest (not verified gifts). */
export const CAMPAIGN_PLEDGE_STORAGE_KEY = "zieg-support-campaign-pledges-v1";

export const CAMPAIGN_ROUTES = {
  primary: "/support-campaign",
  alias: "/campaign",
} as const;

export const CAMPAIGN_COPY = {
  metaTitle: "Join the Mission — Monthly Partnership Campaign",
  metaDescription:
    "Help Jeremy and Lindsay Ziegenhorn reach $2,000 in new monthly partnership to mobilize, equip, and send missionaries to the unreached.",
  heroEyebrow: "Join the mission",
  heroHeadline: "Help Us Reach the Unreached Together",
  heroVision:
    "Jeremy and Lindsay are serving with Team Expansion to mobilize, equip, and send 300 missionaries to the unreached by August 31, 2031.",
  heroCampaignNote:
    "This season, we are prayerfully inviting friends to help close a gap of $2,000 in new monthly partnership so this work can continue with stability and faithfulness.",
  partnershipHeading: "Choose your monthly partnership level",
  partnershipIntro:
    "Select a level to record your pledge interest and open our secure giving page.",
  heartbeatHeading: "Why this matters",
  heartbeatLead:
    "Every day, more than 70,000 people die and enter eternity separated from Christ—not because they have rejected the Gospel, but because they have never had the opportunity to hear it.",
  heartbeatBody:
    "They are unreached with the Gospel, meaning there is no presence of the evangelical church with a mission to reach them.",
  impactHeading: "300 missionaries by 2031",
  impactVision:
    "Jeremy and Lindsay are serving with Team Expansion to mobilize, equip, and send 300 missionaries to the unreached by August 31, 2031.",
  impactPartnership:
    "Monthly partners make that possible—sustaining training, mobilization, and care so workers can be sent and supported for the long haul. Every recurring gift helps close the gap between vision and field reality.",
  finalGivingCta: "Become a Monthly Partner",
} as const;

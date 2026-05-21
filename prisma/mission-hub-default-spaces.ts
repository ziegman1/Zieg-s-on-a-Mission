import type { Prisma } from "@prisma/client";

/** Canonical default Mission Hub spaces — inserted only when slug is missing. */
export type MissionHubDefaultSpace = {
  slug: string;
  title: string;
  description: string;
  icon: string;
  sortOrder: number;
  featured?: boolean;
  spaceType: string;
  themeMood?: string | null;
  welcomeMessage?: string | null;
  engagementPrompt?: string | null;
  allowComments?: boolean;
  allowReactions?: boolean;
  allowMemberPosts?: boolean;
  allowVoiceMessages?: boolean;
  showWelcomeMessage?: boolean;
  pinWelcomeMessage?: boolean;
};

export const PRAYER_PRAISE_WELCOME_MESSAGE = `Welcome to the Prayer & Praise Room

This is a sacred space within Mission Hub where we invite you to truly join us in prayer for our family, our ministry, and the people God is calling us to reach among the nations.

Here you will find prayer requests, ministry updates, stories from the journey, and moments where we are trusting God to move in ways only He can. But this space is not meant to be a place of passive observation. It is an invitation into active participation.

We encourage you not only to respond with reactions, but to genuinely engage with us through prayer, encouragement, written responses, testimonies, and even voice messages as we seek the Lord together.

And as prayers are answered, may this room also become filled with praise to the God of wonders who continues to show His faithfulness again and again.

Thank you for standing with us, praying with us, and becoming part of the story God is writing.`;

export const DEFAULT_MISSION_HUB_SPACES: MissionHubDefaultSpace[] = [
  {
    slug: "start-here",
    title: "Welcome / Start Here",
    description:
      "Your first stop in Mission Hub — how this space works and where to go next.",
    icon: "updates",
    sortOrder: 0,
    featured: true,
    spaceType: "standard",
    welcomeMessage:
      "Welcome to Mission Hub — our family space for prayer, updates, and staying connected on mission.",
    engagementPrompt: "Introduce yourself or share how you found us.",
    showWelcomeMessage: true,
    pinWelcomeMessage: true,
  },
  {
    slug: "prayer-and-praise-room",
    title: "Prayer & Praise Room",
    description:
      "Pray with us, share requests, celebrate answered prayer, and encourage one another.",
    icon: "prayer",
    sortOrder: 10,
    featured: true,
    spaceType: "prayer_room",
    themeMood: "prayerful",
    welcomeMessage: PRAYER_PRAISE_WELCOME_MESSAGE,
    engagementPrompt: "How can we pray with you today?",
    allowComments: true,
    allowReactions: true,
    allowVoiceMessages: false,
    showWelcomeMessage: true,
    pinWelcomeMessage: true,
  },
  {
    slug: "ministry-updates",
    title: "Ministry Updates",
    description:
      "Field notes and honest updates from the work with Team Expansion and partners.",
    icon: "updates",
    sortOrder: 20,
    spaceType: "standard",
    engagementPrompt: "What update encouraged you most?",
  },
  {
    slug: "resources",
    title: "Resources",
    description: "Guides, links, and materials to support prayer and partnership.",
    icon: "resources",
    sortOrder: 30,
    spaceType: "standard",
  },
];

export function defaultSpaceToCreateInput(
  def: MissionHubDefaultSpace,
): Prisma.CommunitySpaceRecordCreateInput {
  return {
    slug: def.slug,
    title: def.title,
    description: def.description,
    icon: def.icon,
    status: "published",
    sortOrder: def.sortOrder,
    featured: def.featured ?? false,
    spaceType: def.spaceType,
    themeMood: def.themeMood ?? null,
    welcomeMessage: def.welcomeMessage ?? null,
    engagementPrompt: def.engagementPrompt ?? null,
    allowComments: def.allowComments ?? true,
    allowReactions: def.allowReactions ?? true,
    allowMemberPosts: def.allowMemberPosts ?? false,
    allowVoiceMessages: def.allowVoiceMessages ?? false,
    showWelcomeMessage: def.showWelcomeMessage ?? true,
    pinWelcomeMessage: def.pinWelcomeMessage ?? true,
    settings: {},
  };
}

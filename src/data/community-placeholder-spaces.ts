import type { CommunitySpace } from "@/lib/community/types";

/**
 * Planned Mission Hub spaces — shown as coming-soon placeholders until admin tooling ships.
 * Replace with data from `community_spaces` when Supabase is connected.
 */
export const PLACEHOLDER_COMMUNITY_SPACES: CommunitySpace[] = [
  {
    id: "placeholder-prayer",
    slug: "prayer-room",
    title: "Prayer Room",
    description: "Prayer requests, updates, and ways to intercede with us on mission.",
    icon: "prayer",
    status: "coming_soon",
    postCount: 0,
    sortOrder: 1,
  },
  {
    id: "placeholder-praise",
    slug: "praise-reports",
    title: "Praise Reports",
    description: "Celebrate what God is doing — stories of faithfulness and fruit.",
    icon: "praise",
    status: "coming_soon",
    postCount: 0,
    sortOrder: 2,
  },
  {
    id: "placeholder-updates",
    slug: "ministry-updates",
    title: "Ministry Updates",
    description: "Field notes and honest updates from the work with Team Expansion.",
    icon: "updates",
    status: "coming_soon",
    postCount: 0,
    sortOrder: 3,
  },
  {
    id: "placeholder-bts",
    slug: "behind-the-scenes",
    title: "Behind the Scenes",
    description: "Life on mission at home and abroad — the everyday moments that shape the story.",
    icon: "behind_scenes",
    status: "coming_soon",
    postCount: 0,
    sortOrder: 4,
  },
  {
    id: "placeholder-newsletters",
    slug: "newsletters",
    title: "Newsletters",
    description: "Archived and current newsletters for partners and friends.",
    icon: "newsletter",
    status: "coming_soon",
    postCount: 0,
    sortOrder: 5,
  },
  {
    id: "placeholder-blog",
    slug: "blog",
    title: "Blog",
    description: "Longer reflections and resources — a dedicated space inside the hub.",
    icon: "blog",
    status: "coming_soon",
    postCount: 0,
    sortOrder: 6,
  },
  {
    id: "placeholder-resources",
    slug: "resources",
    title: "Resources",
    description: "Downloads, links, and tools we love for mission-minded friends.",
    icon: "resources",
    status: "coming_soon",
    postCount: 0,
    sortOrder: 7,
  },
  {
    id: "placeholder-events",
    slug: "events",
    title: "Events",
    description: "Gatherings, calls, and key dates for our ministry family.",
    icon: "events",
    status: "coming_soon",
    postCount: 0,
    sortOrder: 8,
  },
];


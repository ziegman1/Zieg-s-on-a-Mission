import type { CommunitySpaceDbStatus, CommunitySpaceIcon } from "@/lib/community/types";

export const COMMUNITY_SPACE_STATUSES: CommunitySpaceDbStatus[] = [
  "draft",
  "published",
  "archived",
];

export const COMMUNITY_SPACE_ICONS: { value: CommunitySpaceIcon; label: string }[] = [
  { value: "prayer", label: "Prayer Room" },
  { value: "praise", label: "Praise Reports" },
  { value: "updates", label: "Ministry Updates" },
  { value: "behind_scenes", label: "Behind the Scenes" },
  { value: "newsletter", label: "Newsletters" },
  { value: "blog", label: "Blog" },
  { value: "resources", label: "Resources" },
  { value: "events", label: "Events" },
];

export const DEFAULT_COMMUNITY_ICON: CommunitySpaceIcon = "updates";

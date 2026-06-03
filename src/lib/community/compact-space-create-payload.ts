import { DEFAULT_COMMUNITY_ICON } from "@/lib/community/constants";
import type { CommunitySpaceFormInput } from "@/lib/community/space-form";
import {
  DEFAULT_SPACE_NOTIFICATION_CATEGORY,
  type SpaceNotificationCategory,
} from "@/lib/community/space-notification-category-values";
import { slugifyCommunityTitle } from "@/lib/community/slug";
import type { CommunitySpaceIcon } from "@/lib/community/types";
import type { CommunitySpaceType } from "@/lib/community/space-experience";
import { defaultAllowVoiceMessagesForSpace } from "@/lib/community/voice-prayer";

function iconToSpaceType(icon: CommunitySpaceIcon): CommunitySpaceType {
  if (icon === "prayer") return "prayer";
  if (icon === "praise") return "praise_room";
  return "standard";
}

/** Infer notification routing from icon/title when the compact form has no category picker. */
export function inferSpaceNotificationCategory(
  title: string,
  icon: CommunitySpaceIcon,
): SpaceNotificationCategory {
  const normalized = `${title} ${slugifyCommunityTitle(title)}`.toLowerCase();
  if (normalized.includes("blog")) return "blog_articles";
  if (normalized.includes("newsletter")) return "newsletters";
  if (normalized.includes("resource")) return "resources";
  if (normalized.includes("prayer")) return "prayer_requests";
  if (normalized.includes("praise")) return "praise_reports";
  if (normalized.includes("ministry") || normalized.includes("update")) {
    return "ministry_updates";
  }

  switch (icon) {
    case "blog":
      return "blog_articles";
    case "newsletter":
      return "newsletters";
    case "resources":
      return "resources";
    case "prayer":
      return "prayer_requests";
    case "praise":
      return "praise_reports";
    case "updates":
    case "behind_scenes":
      return "ministry_updates";
    default:
      return DEFAULT_SPACE_NOTIFICATION_CATEGORY;
  }
}

export function buildCompactSpaceCreatePayload(input: {
  title: string;
  description?: string;
  icon?: CommunitySpaceIcon;
  coverImageUrl?: string;
}): CommunitySpaceFormInput {
  const title = input.title.trim();
  const icon = input.icon ?? DEFAULT_COMMUNITY_ICON;
  const slug = slugifyCommunityTitle(title);
  const spaceType = iconToSpaceType(icon);
  const cover = input.coverImageUrl?.trim() ?? "";

  return {
    title,
    slug,
    description: input.description?.trim() || undefined,
    icon,
    status: "published",
    sortOrder: 0,
    coverImageUrl: cover || undefined,
    spaceType,
    themeMood: "",
    welcomeMessage: "",
    engagementPrompt: "",
    allowComments: true,
    allowReactions: true,
    allowMemberPosts: false,
    requirePostApproval: false,
    allowVoiceMessages: defaultAllowVoiceMessagesForSpace(spaceType, slug),
    showWelcomeMessage: true,
    pinWelcomeMessage: true,
    notificationCategory: inferSpaceNotificationCategory(title, icon),
  };
}

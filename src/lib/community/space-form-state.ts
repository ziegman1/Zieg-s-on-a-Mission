import type { CommunitySpaceRecord } from "@prisma/client";
import { DEFAULT_COMMUNITY_ICON } from "@/lib/community/constants";
import {
  parseSpaceIcon,
  parseSpaceType,
  parseThemeMood,
  type CommunitySpaceType,
  type CommunityThemeMood,
} from "@/lib/community/space-experience";
import type { CommunitySpaceFormInput } from "@/lib/community/space-form";
import type { CommunitySpaceDbStatus, CommunitySpaceIcon } from "@/lib/community/types";
import { COMMUNITY_SPACE_STATUSES } from "@/lib/community/constants";
import {
  defaultAllowVoiceMessagesForSpace,
  hydrateAllowVoiceMessages,
} from "@/lib/community/voice-prayer";

export type SpaceFormState = {
  title: string;
  slug: string;
  description: string;
  icon: CommunitySpaceIcon;
  status: CommunitySpaceDbStatus;
  sortOrder: number;
  coverImageUrl: string;
  spaceType: CommunitySpaceType;
  themeMood: CommunityThemeMood | "";
  welcomeMessage: string;
  engagementPrompt: string;
  allowComments: boolean;
  allowReactions: boolean;
  allowMemberPosts: boolean;
  requirePostApproval: boolean;
  allowVoiceMessages: boolean;
  showWelcomeMessage: boolean;
  pinWelcomeMessage: boolean;
};

export const emptySpaceForm = (): SpaceFormState => ({
  title: "",
  slug: "",
  description: "",
  icon: DEFAULT_COMMUNITY_ICON,
  status: "draft",
  sortOrder: 0,
  coverImageUrl: "",
  spaceType: "standard",
  themeMood: "",
  welcomeMessage: "",
  engagementPrompt: "",
  allowComments: true,
  allowReactions: true,
  allowMemberPosts: false,
  requirePostApproval: false,
  allowVoiceMessages: false,
  showWelcomeMessage: true,
  pinWelcomeMessage: true,
});

export function spaceRecordToForm(row: CommunitySpaceRecord): SpaceFormState {
  const status = COMMUNITY_SPACE_STATUSES.includes(row.status as CommunitySpaceDbStatus)
    ? (row.status as CommunitySpaceDbStatus)
    : "draft";
  return {
    title: row.title,
    slug: row.slug,
    description: row.description ?? "",
    icon: parseSpaceIcon(row.icon),
    status,
    sortOrder: row.sortOrder,
    coverImageUrl: row.coverImageUrl ?? "",
    spaceType: parseSpaceType(row.spaceType, row.slug),
    themeMood: parseThemeMood(row.themeMood) ?? "",
    welcomeMessage: row.welcomeMessage ?? "",
    engagementPrompt: row.engagementPrompt ?? "",
    allowComments: row.allowComments,
    allowReactions: row.allowReactions,
    allowMemberPosts: row.allowMemberPosts,
    requirePostApproval: row.requirePostApproval,
    allowVoiceMessages: hydrateAllowVoiceMessages({
      spaceType: row.spaceType,
      slug: row.slug,
      allowVoiceMessages: row.allowVoiceMessages,
      settings: row.settings,
    }),
    showWelcomeMessage: row.showWelcomeMessage,
    pinWelcomeMessage: row.pinWelcomeMessage,
  };
}

export function spaceFormToPayload(form: SpaceFormState): CommunitySpaceFormInput {
  return {
    title: form.title,
    slug: form.slug,
    description: form.description,
    icon: form.icon,
    status: form.status,
    sortOrder: form.sortOrder,
    coverImageUrl: form.coverImageUrl,
    spaceType: form.spaceType,
    themeMood: form.themeMood,
    welcomeMessage: form.welcomeMessage,
    engagementPrompt: form.engagementPrompt,
    allowComments: form.allowComments,
    allowReactions: form.allowReactions,
    allowMemberPosts: form.allowMemberPosts,
    requirePostApproval: form.requirePostApproval,
    allowVoiceMessages: form.allowVoiceMessages,
    showWelcomeMessage: form.showWelcomeMessage,
    pinWelcomeMessage: form.pinWelcomeMessage,
  };
}

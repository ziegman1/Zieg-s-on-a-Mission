import { z } from "zod";
import { DEFAULT_COMMUNITY_ICON } from "@/lib/community/constants";
import {
  COMMUNITY_SPACE_TYPES,
  COMMUNITY_THEME_MOODS,
} from "@/lib/community/space-experience";

const iconSchema = z.enum([
  "prayer",
  "praise",
  "updates",
  "behind_scenes",
  "newsletter",
  "blog",
  "resources",
  "events",
]);

const spaceTypeSchema = z.enum(
  COMMUNITY_SPACE_TYPES.map((t) => t.value) as [string, ...string[]],
);

const themeMoodSchema = z
  .enum(COMMUNITY_THEME_MOODS.map((t) => t.value) as [string, ...string[]])
  .optional()
  .or(z.literal(""));

export const communitySpaceInputSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens"),
  description: z.string().max(4000).optional(),
  icon: iconSchema.default(DEFAULT_COMMUNITY_ICON),
  status: z.enum(["draft", "published", "archived"]),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  coverImageUrl: z.string().url().max(2000).optional().or(z.literal("")),
  spaceType: spaceTypeSchema.default("standard"),
  themeMood: themeMoodSchema,
  welcomeMessage: z.string().max(12000).optional().or(z.literal("")),
  engagementPrompt: z.string().max(500).optional().or(z.literal("")),
  allowComments: z.boolean().default(true),
  allowReactions: z.boolean().default(true),
  allowMemberPosts: z.boolean().default(false),
  requirePostApproval: z.boolean().default(false),
  allowVoiceMessages: z.boolean().default(false),
  showWelcomeMessage: z.boolean().default(true),
  pinWelcomeMessage: z.boolean().default(true),
});

export type CommunitySpaceFormInput = z.infer<typeof communitySpaceInputSchema>;

export function spaceFormDataFromInput(data: CommunitySpaceFormInput) {
  return {
    title: data.title.trim(),
    slug: data.slug,
    description: data.description?.trim() || null,
    icon: data.icon,
    status: data.status,
    sortOrder: data.sortOrder,
    coverImageUrl: data.coverImageUrl?.trim() || null,
    spaceType: data.spaceType,
    themeMood: data.themeMood?.trim() || null,
    welcomeMessage: data.welcomeMessage?.trim() || null,
    engagementPrompt: data.engagementPrompt?.trim() || null,
    allowComments: data.allowComments,
    allowReactions: data.allowReactions,
    allowMemberPosts: data.allowMemberPosts,
    requirePostApproval: data.requirePostApproval,
    allowVoiceMessages: data.allowVoiceMessages,
    showWelcomeMessage: data.showWelcomeMessage,
    pinWelcomeMessage: data.pinWelcomeMessage,
  };
}

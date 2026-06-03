import { z } from "zod";
import { DEFAULT_COMMUNITY_POST_TYPE } from "@/lib/community/post-constants";

const postTypeSchema = z.enum([
  "prayer",
  "praise",
  "encouragement",
  "update",
  "newsletter",
  "blog",
  "behind_the_scenes",
  "resource",
  "event",
]);

export const communityPostInputSchema = z.object({
  spaceId: z.string().uuid(),
  title: z.string().max(300).optional(),
  body: z.string().min(1).max(50000),
  excerpt: z.string().max(2000).optional(),
  postType: postTypeSchema.default(DEFAULT_COMMUNITY_POST_TYPE),
  status: z.enum(["draft", "published", "archived"]),
  coverImageUrl: z.string().max(2000).optional(),
  publishedAt: z.string().optional(),
  /** Admin-only: send urgent prayer email + in-app notification fan-out. */
  urgentPrayerRequest: z.boolean().optional(),
});

export type CommunityPostFormInput = z.infer<typeof communityPostInputSchema>;

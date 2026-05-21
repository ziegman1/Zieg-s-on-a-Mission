import { z } from "zod";

export const COMMUNITY_MEMBER_STATUSES = ["active", "pending", "blocked"] as const;
export type CommunityMemberStatus = (typeof COMMUNITY_MEMBER_STATUSES)[number];

/** Legacy visitor-only profile (optional when MISSION_HUB_ALLOW_VISITOR_COMMENTS=1). */
export const createVisitorMemberProfileSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email().max(200).optional().or(z.literal("")),
  profileImageUrl: z.string().url().max(2000).optional().or(z.literal("")),
});

export type CreateVisitorMemberProfileInput = z.infer<typeof createVisitorMemberProfileSchema>;

export const joinCommunitySchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email().max(200),
  password: z.string().min(8).max(128),
  profileImageUrl: z.string().url().max(2000).optional().or(z.literal("")),
});

export type JoinCommunityInput = z.infer<typeof joinCommunitySchema>;

export const updateMemberProfileSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  displayName: z.string().max(80).optional().or(z.literal("")),
  bio: z.string().max(280).optional().or(z.literal("")),
  profileImageUrl: z.string().url().max(2000).optional().or(z.literal("")),
});

export type UpdateMemberProfileInput = z.infer<typeof updateMemberProfileSchema>;

import { z } from "zod";
import type { PartnershipPreferences } from "@/lib/community/partnership-preferences";

/** Settings URL sections — modular nav keys */
export const USER_SETTINGS_SECTIONS = [
  "profile",
  "partnership",
  "notifications",
  "account",
] as const;
export const ADMIN_SETTINGS_SECTIONS = ["hub", "spaces", "community"] as const;
export const SETTINGS_SECTIONS = [...USER_SETTINGS_SECTIONS, ...ADMIN_SETTINGS_SECTIONS] as const;

export type UserSettingsSection = (typeof USER_SETTINGS_SECTIONS)[number];
export type AdminSettingsSection = (typeof ADMIN_SETTINGS_SECTIONS)[number];
export type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

export function isSettingsSection(value: string): value is SettingsSection {
  return (SETTINGS_SECTIONS as readonly string[]).includes(value);
}

export function parseSettingsSection(
  raw: string | null | undefined,
  isAdmin: boolean,
): SettingsSection {
  if (raw && isSettingsSection(raw)) {
    if (!isAdmin && (ADMIN_SETTINGS_SECTIONS as readonly string[]).includes(raw)) {
      return "profile";
    }
    return raw;
  }
  return "profile";
}

export const NOTIFICATION_PREF_KEYS = [
  "commentsOnPosts",
  "repliesToComments",
  "prayerResponses",
  "newPosts",
  "ministryUpdates",
  "praiseReports",
  "newsletters",
  "weeklyDigest",
] as const;

export type NotificationPrefKey = (typeof NOTIFICATION_PREF_KEYS)[number];

export type NotificationPreferences = Record<NotificationPrefKey, boolean> & {
  inApp: boolean;
  email: boolean;
  /** Future mobile app — default off */
  push: boolean;
  /** Space UUIDs where the member muted notifications */
  mutedSpaceIds: string[];
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  commentsOnPosts: true,
  repliesToComments: true,
  prayerResponses: true,
  newPosts: true,
  ministryUpdates: true,
  praiseReports: true,
  newsletters: true,
  weeklyDigest: true,
  inApp: true,
  email: true,
  push: false,
  mutedSpaceIds: [],
};

export const NOTIFICATION_PREF_LABELS: Record<
  NotificationPrefKey,
  { label: string; description: string }
> = {
  commentsOnPosts: {
    label: "Comments on posts",
    description: "When someone comments on a post you follow or own.",
  },
  repliesToComments: {
    label: "Replies to your comments",
    description: "When someone replies directly to you.",
  },
  prayerResponses: {
    label: "Prayer responses",
    description: "Prayer and amen reactions on posts you care about.",
  },
  newPosts: {
    label: "New posts",
    description: "When new updates are published in your spaces.",
  },
  ministryUpdates: {
    label: "Ministry updates",
    description: "Important announcements from the team.",
  },
  newsletters: {
    label: "Newsletters",
    description: "When a new newsletter is published (Mission Hub announcement + email when enabled).",
  },
  weeklyDigest: {
    label: "Weekly digest",
    description: "A weekly summary of newsletters and Mission Hub highlights (email when enabled).",
  },
  praiseReports: {
    label: "Praise reports",
    description: "Celebrations and praise shared in the community.",
  },
};

export const NOTIFICATION_CHANNEL_LABELS = {
  inApp: {
    label: "In-app notifications",
    description: "Bell icon and activity list in Mission Hub.",
  },
  email: {
    label: "Email notifications",
    description: "Transactional email when delivery is enabled (newsletters, digest, and alerts).",
  },
  push: {
    label: "Push notifications",
    description: "Mobile alerts when the Mission Hub app is available.",
  },
} as const;

export function mergeNotificationPreferences(
  raw: unknown,
): NotificationPreferences {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  const o = raw as Record<string, unknown>;
  const out = { ...DEFAULT_NOTIFICATION_PREFERENCES };
  for (const key of NOTIFICATION_PREF_KEYS) {
    if (typeof o[key] === "boolean") out[key] = o[key];
  }
  if (typeof o.inApp === "boolean") out.inApp = o.inApp;
  if (typeof o.email === "boolean") out.email = o.email;
  if (typeof o.push === "boolean") out.push = o.push;
  if (Array.isArray(o.mutedSpaceIds)) {
    out.mutedSpaceIds = o.mutedSpaceIds.filter(
      (id): id is string => typeof id === "string" && id.trim().length > 0,
    );
  }
  return out;
}

export const communitySpaceSettingsSchema = z.object({
  allowComments: z.boolean().default(true),
  allowReactions: z.boolean().default(true),
  allowMemberPosting: z.boolean().default(false),
  requirePostApproval: z.boolean().default(false),
  pinFeaturedPosts: z.boolean().default(false),
  feedSort: z.enum(["newest", "oldest"]).default("newest"),
  /** Mirrors `community_spaces.allow_voice_messages` for JSON consumers */
  allowVoiceMessages: z.boolean().optional(),
  /** Cover image includes title/tagline — hide hero text overlays */
  hasEmbeddedCoverText: z.boolean().optional(),
  /** When false, hero shows image only; when true, show title/subtitle overlay */
  renderCoverOverlay: z.boolean().optional(),
});

export type CommunitySpaceSettings = z.infer<typeof communitySpaceSettingsSchema>;

export const DEFAULT_SPACE_SETTINGS: CommunitySpaceSettings = {
  allowComments: true,
  allowReactions: true,
  allowMemberPosting: false,
  requirePostApproval: false,
  pinFeaturedPosts: false,
  feedSort: "newest",
};

export function mergeSpaceSettings(raw: unknown): CommunitySpaceSettings {
  const parsed = communitySpaceSettingsSchema.safeParse(raw);
  const base = parsed.success ? parsed.data : { ...DEFAULT_SPACE_SETTINGS };
  if (!raw || typeof raw !== "object") return base;
  const o = raw as Record<string, unknown>;
  return {
    ...base,
    ...(typeof o.allowVoiceMessages === "boolean"
      ? { allowVoiceMessages: o.allowVoiceMessages }
      : {}),
    ...(typeof o.hasEmbeddedCoverText === "boolean"
      ? { hasEmbeddedCoverText: o.hasEmbeddedCoverText }
      : {}),
    ...(typeof o.renderCoverOverlay === "boolean"
      ? { renderCoverOverlay: o.renderCoverOverlay }
      : {}),
  };
}

export type CommunityHubSettings = {
  title: string | null;
  tagline: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  welcomeText: string | null;
  invitationTitle: string | null;
  invitationBody: string | null;
};

export const DEFAULT_HUB_INVITATION = {
  title: "Join Us in God's Mission",
  body: "We believe every follower of Jesus has a role to play in seeing the nations reached with the gospel. Thank you for being part of the journey with us.",
};

export type SettingsPageData = {
  section: SettingsSection;
  isAdmin: boolean;
  userId: string;
  email: string | null;
  member: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    bio: string | null;
    profileImageUrl: string | null;
    email: string | null;
  } | null;
  ownerDisplayName: string | null;
  ownerImageUrl: string | null;
  notificationPrefs: NotificationPreferences;
  partnershipPrefs: PartnershipPreferences | null;
  /** Published spaces for per-space mute toggles */
  muteableSpaces: MuteableSpaceOption[];
  hubSettings: CommunityHubSettings | null;
  adminSpaces: AdminSpaceSettingsRow[];
};

export type MuteableSpaceOption = {
  id: string;
  title: string;
  slug: string;
};

export type AdminSpaceSettingsRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  status: string;
  sortOrder: number;
  featured: boolean;
  coverImageUrl: string | null;
  spaceType: string;
  themeMood: string | null;
  welcomeMessage: string | null;
  engagementPrompt: string | null;
  allowComments: boolean;
  allowReactions: boolean;
  allowMemberPosts: boolean;
  requirePostApproval: boolean;
  allowVoiceMessages: boolean;
  showWelcomeMessage: boolean;
  pinWelcomeMessage: boolean;
  settings: CommunitySpaceSettings;
};

export const updateProfileSettingsSchema = z.object({
  firstName: z.string().min(1).max(60).optional(),
  lastName: z.string().min(1).max(60).optional(),
  displayName: z.string().max(80).optional().or(z.literal("")),
  bio: z.string().max(280).optional().or(z.literal("")),
  profileImageUrl: z.string().url().max(2000).optional().or(z.literal("")),
  ownerName: z.string().max(120).optional(),
});

export const updateNotificationPrefsSchema = z.object({
  commentsOnPosts: z.boolean(),
  repliesToComments: z.boolean(),
  prayerResponses: z.boolean(),
  newPosts: z.boolean(),
  ministryUpdates: z.boolean(),
  praiseReports: z.boolean(),
  newsletters: z.boolean(),
  weeklyDigest: z.boolean(),
  inApp: z.boolean(),
  email: z.boolean(),
  push: z.boolean(),
  mutedSpaceIds: z.array(z.string().uuid()).default([]),
});

export const updateHubSettingsSchema = z.object({
  title: z.string().max(120).optional().or(z.literal("")),
  tagline: z.string().max(200).optional().or(z.literal("")),
  logoUrl: z.string().url().max(2000).optional().or(z.literal("")),
  coverImageUrl: z.string().url().max(2000).optional().or(z.literal("")),
  welcomeText: z.string().max(2000).optional().or(z.literal("")),
  invitationTitle: z.string().max(160).optional().or(z.literal("")),
  invitationBody: z.string().max(2000).optional().or(z.literal("")),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

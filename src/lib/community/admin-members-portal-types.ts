import type { CommunityMemberStatus } from "@/lib/community/member-form";
import type { NotificationPreferences } from "@/lib/community/settings-types";
import type { PartnershipPreferences } from "@/lib/community/partnership-preferences";

export type AdminMemberPortalRow = {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  displayName: string | null;
  email: string | null;
  userEmail: string | null;
  profileImageUrl: string | null;
  visitorKey: string | null;
  status: CommunityMemberStatus;
  userRole: string | null;
  userRoleLabel: string;
  hasLinkedAccount: boolean;
  joinedAt: string;
  lastActiveAt: string | null;
  commentCount: number;
  postCount: number;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  newslettersEnabled: boolean;
  newPostsEnabled: boolean;
  mutedSpaceIds: string[];
  mutedSpaceSlugs: string[];
  unreadNotificationCount: number;
  partnershipCompleted: boolean;
  ministryUpdates: boolean;
  newsletters: boolean;
  prayerTeam: boolean;
  urgentPrayerRequests: boolean;
  advocacyInterest: boolean;
  financialPartnership: boolean;
};

export type AdminMemberDetail = AdminMemberPortalRow & {
  bio: string | null;
  notificationPreferences: NotificationPreferences;
  partnershipPreferences: PartnershipPreferences | null;
  mutedSpaces: { id: string; title: string; slug: string }[];
  publishedSpaces: { id: string; title: string; slug: string }[];
  recentComments: {
    id: string;
    postId: string;
    body: string;
    createdAt: string;
    spaceSlug: string | null;
    spaceTitle: string | null;
  }[];
  recentPosts: {
    id: string;
    title: string | null;
    spaceSlug: string;
    spaceTitle: string;
    status: string;
    publishedAt: string | null;
    createdAt: string;
  }[];
  emailDeliveries: {
    id: string;
    notificationKind: string;
    status: string;
    recipientEmail: string;
    dedupeKey: string;
    resendMessageId: string | null;
    errorMessage: string | null;
    createdAt: string;
    sentAt: string | null;
  }[];
  notifications: {
    id: string;
    type: string;
    title: string;
    readAt: string | null;
    createdAt: string;
  }[];
};

export function displayEmail(row: {
  email: string | null;
  userEmail: string | null;
}): string | null {
  return row.userEmail?.trim() || row.email?.trim() || null;
}

export function formatNotificationPrefsSummary(row: AdminMemberPortalRow): string {
  const parts: string[] = [];
  if (row.inAppEnabled) parts.push("In-app");
  if (row.emailEnabled) parts.push("Email");
  if (row.newslettersEnabled) parts.push("Newsletters");
  if (row.newPostsEnabled) parts.push("New posts");
  if (row.mutedSpaceSlugs.length > 0) {
    parts.push(`Muted: ${row.mutedSpaceSlugs.join(", ")}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Defaults";
}

export function formatPartnershipSegmentSummary(row: AdminMemberPortalRow): string {
  if (!row.partnershipCompleted) return "Onboarding pending";
  const parts: string[] = [];
  if (row.ministryUpdates) parts.push("Ministry");
  if (row.newsletters) parts.push("Newsletter");
  if (row.prayerTeam) parts.push("Prayer team");
  if (row.urgentPrayerRequests) parts.push("Urgent prayer");
  if (row.advocacyInterest) parts.push("Advocacy");
  if (row.financialPartnership) parts.push("Giving");
  return parts.length > 0 ? parts.join(" · ") : "None selected";
}

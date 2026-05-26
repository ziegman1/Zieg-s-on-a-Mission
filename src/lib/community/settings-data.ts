import { auth } from "@/auth";
import { isAdminRole } from "@/lib/admin-users";
import { getCommunityHubSettings } from "@/lib/community/hub-settings";
import { getCurrentCommunityMember } from "@/lib/community/members";
import { getCurrentCommunityOwner } from "@/lib/community/owner";
import {
  mergeSpaceSettings,
  parseSettingsSection,
  type AdminSpaceSettingsRow,
  type SettingsPageData,
} from "@/lib/community/settings-types";
import { getUserNotificationPreferences } from "@/lib/community/user-notification-prefs";
import { getUserPartnershipPreferences } from "@/lib/community/user-partnership-prefs";
import { communitySpaceListOrderBy } from "@/lib/community/space-order";
import { hydrateAllowVoiceMessages } from "@/lib/community/voice-prayer";
import { prisma } from "@/lib/db";

export async function loadSettingsPageData(
  sectionParam: string | undefined,
): Promise<SettingsPageData | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [owner, member, user, notificationPrefs, partnershipPrefs, muteableSpaces] =
    await Promise.all([
    getCurrentCommunityOwner(),
    getCurrentCommunityMember(),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, image: true },
    }),
    getUserNotificationPreferences(session.user.id),
    getUserPartnershipPreferences(session.user.id),
    prisma.communitySpaceRecord.findMany({
      where: { status: "published" },
      orderBy: communitySpaceListOrderBy,
      select: { id: true, title: true, slug: true },
    }),
  ]);

  const isAdmin = isAdminRole(session.user.role);
  if (!member && !isAdmin) return null;

  const section = parseSettingsSection(sectionParam, isAdmin);

  let hubSettings = null;
  let adminSpaces: AdminSpaceSettingsRow[] = [];

  if (isAdmin) {
    hubSettings = await getCommunityHubSettings();
    const rows = await prisma.communitySpaceRecord.findMany({
      orderBy: communitySpaceListOrderBy,
    });
    adminSpaces = rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description ?? "",
      icon: row.icon ?? "updates",
      status: row.status,
      sortOrder: row.sortOrder,
      featured: row.featured,
      coverImageUrl: row.coverImageUrl,
      spaceType: row.spaceType,
      themeMood: row.themeMood,
      welcomeMessage: row.welcomeMessage,
      engagementPrompt: row.engagementPrompt,
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
      settings: mergeSpaceSettings(row.settings),
    }));
  }

  return {
    section,
    isAdmin,
    userId: session.user.id,
    email: user?.email ?? session.user.email ?? null,
    member: member
      ? {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          displayName: null,
          bio: null,
          profileImageUrl: member.profileImageUrl,
          email: member.email,
        }
      : null,
    ownerDisplayName: owner ? (user?.name ?? owner.name) : null,
    ownerImageUrl: owner ? (user?.image ?? null) : null,
    notificationPrefs,
    partnershipPrefs,
    muteableSpaces,
    hubSettings,
    adminSpaces,
  };
}

/** Hydrate member extended fields from DB (displayName, bio). */
export async function hydrateMemberSettingsFields(
  data: SettingsPageData,
): Promise<SettingsPageData> {
  if (!data.member) return data;
  const row = await prisma.communityMemberRecord.findUnique({
    where: { id: data.member.id },
    select: { displayName: true, bio: true, profileImageUrl: true },
  });
  if (!row) return data;
  return {
    ...data,
    member: {
      ...data.member,
      displayName: row.displayName,
      bio: row.bio,
      profileImageUrl: row.profileImageUrl,
    },
  };
}

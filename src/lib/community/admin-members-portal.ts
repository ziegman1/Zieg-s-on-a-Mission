import "server-only";

import { roleLabel } from "@/lib/auth-roles";
import { isCommunityMemberStatus } from "@/lib/community/members";
import { mergePartnershipPreferences } from "@/lib/community/partnership-preferences";
import { mergeNotificationPreferences } from "@/lib/community/settings-types";
import type {
  AdminMemberDetail,
  AdminMemberPortalRow,
} from "@/lib/community/admin-members-portal-types";
import { prisma } from "@/lib/db";

export { countActiveMembersThisWeek } from "@/lib/community/admin-members-active-week";
export type { AdminMemberDetail, AdminMemberPortalRow } from "@/lib/community/admin-members-portal-types";
export {
  displayEmail,
  formatNotificationPrefsSummary,
  formatPartnershipSegmentSummary,
} from "@/lib/community/admin-members-portal-types";

function partnershipFieldsFromRaw(raw: unknown) {
  const p = mergePartnershipPreferences(raw);
  return {
    partnershipCompleted: Boolean(p?.onboardingCompletedAt),
    ministryUpdates: p?.ministryUpdates ?? false,
    newsletters: p?.newsletters ?? false,
    prayerTeam: p?.prayerTeam ?? false,
    urgentPrayerRequests: p?.urgentPrayerRequests ?? false,
    advocacyInterest: p?.advocacyInterest ?? false,
    financialPartnership: p?.financialPartnership ?? false,
  };
}

function maxIso(dates: (Date | null | undefined)[]): string | null {
  let max: number | null = null;
  for (const d of dates) {
    if (!d) continue;
    const t = d.getTime();
    if (!Number.isNaN(t) && (max === null || t > max)) max = t;
  }
  return max !== null ? new Date(max).toISOString() : null;
}

export async function listMembersForAdminPortal(): Promise<AdminMemberPortalRow[]> {
  const [rows, spaces] = await Promise.all([
    prisma.communityMemberRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 1000,
      include: {
        user: {
          select: {
            email: true,
            role: true,
            communityNotificationPrefs: true,
            communityEngagementPrefs: true,
          },
        },
        _count: { select: { comments: true } },
      },
    }),
    prisma.communitySpaceRecord.findMany({
      where: { status: "published" },
      select: { id: true, slug: true },
    }),
  ]);

  const spaceSlugById = new Map(spaces.map((s) => [s.id, s.slug]));
  const memberIds = rows.map((r) => r.id);
  const userIds = rows.map((r) => r.userId).filter((id): id is string => Boolean(id));

  const [commentLastByMember, postCountByUser, postLastByUser, unreadByUser] =
    await Promise.all([
      memberIds.length
        ? prisma.communityPostCommentRecord.groupBy({
            by: ["memberId"],
            where: { memberId: { in: memberIds } },
            _max: { createdAt: true },
          })
        : Promise.resolve([]),
      userIds.length
        ? prisma.communityPostRecord.groupBy({
            by: ["authorUserId"],
            where: { authorUserId: { in: userIds } },
            _count: { id: true },
          })
        : Promise.resolve([]),
      userIds.length
        ? prisma.communityPostRecord.groupBy({
            by: ["authorUserId"],
            where: { authorUserId: { in: userIds } },
            _max: { updatedAt: true },
          })
        : Promise.resolve([]),
      userIds.length
        ? prisma.communityNotificationRecord.groupBy({
            by: ["recipientUserId"],
            where: { recipientUserId: { in: userIds }, readAt: null },
            _count: { id: true },
          })
        : Promise.resolve([]),
    ]);

  const commentLastMap = new Map(
    commentLastByMember
      .filter((g) => g.memberId)
      .map((g) => [g.memberId as string, g._max.createdAt]),
  );
  const postCountMap = new Map(
    postCountByUser
      .filter((g) => g.authorUserId)
      .map((g) => [g.authorUserId as string, g._count.id]),
  );
  const postLastMap = new Map(
    postLastByUser
      .filter((g) => g.authorUserId)
      .map((g) => [g.authorUserId as string, g._max.updatedAt]),
  );
  const unreadMap = new Map(
    unreadByUser
      .filter((g) => g.recipientUserId)
      .map((g) => [g.recipientUserId as string, g._count.id]),
  );

  return rows.map((row) => {
    const status = isCommunityMemberStatus(row.status) ? row.status : "active";
    const prefs = mergeNotificationPreferences(row.user?.communityNotificationPrefs);
    const partnership = partnershipFieldsFromRaw(row.user?.communityEngagementPrefs);
    const mutedSpaceIds = prefs.mutedSpaceIds ?? [];
    const userId = row.userId;
    const userRole = row.user?.role ?? null;

    return {
      id: row.id,
      userId,
      firstName: row.firstName,
      lastName: row.lastName,
      displayName: row.displayName,
      email: row.email,
      userEmail: row.user?.email ?? null,
      profileImageUrl: row.profileImageUrl,
      visitorKey: row.visitorKey,
      status,
      userRole: userRole ? String(userRole) : null,
      userRoleLabel: userRole ? roleLabel(userRole) : "Visitor profile",
      hasLinkedAccount: Boolean(userId),
      joinedAt: row.createdAt.toISOString(),
      lastActiveAt: maxIso([
        row.updatedAt,
        commentLastMap.get(row.id),
        userId ? postLastMap.get(userId) : null,
      ]),
      commentCount: row._count.comments,
      postCount: userId ? (postCountMap.get(userId) ?? 0) : 0,
      inAppEnabled: prefs.inApp === true,
      emailEnabled: prefs.email === true,
      newslettersEnabled: prefs.newsletters !== false,
      newPostsEnabled: prefs.newPosts !== false,
      mutedSpaceIds,
      mutedSpaceSlugs: mutedSpaceIds
        .map((id) => spaceSlugById.get(id))
        .filter((slug): slug is string => Boolean(slug)),
      unreadNotificationCount: userId ? (unreadMap.get(userId) ?? 0) : 0,
      ...partnership,
    };
  });
}

function buildPortalRowForMember(
  row: {
    id: string;
    userId: string | null;
    firstName: string;
    lastName: string;
    displayName: string | null;
    email: string | null;
    profileImageUrl: string | null;
    visitorKey: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
      email: string | null;
      role: string;
      communityNotificationPrefs: unknown;
      communityEngagementPrefs: unknown;
    } | null;
    _count: { comments: number };
  },
  spaceSlugById: Map<string, string>,
  extras: {
    postCount: number;
    lastActiveAt: string | null;
    unreadNotificationCount: number;
  },
): AdminMemberPortalRow {
  const status = isCommunityMemberStatus(row.status) ? row.status : "active";
  const prefs = mergeNotificationPreferences(row.user?.communityNotificationPrefs);
  const partnership = partnershipFieldsFromRaw(row.user?.communityEngagementPrefs);
  const mutedSpaceIds = prefs.mutedSpaceIds ?? [];
  const userRole = row.user?.role ?? null;

  return {
    id: row.id,
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    displayName: row.displayName,
    email: row.email,
    userEmail: row.user?.email ?? null,
    profileImageUrl: row.profileImageUrl,
    visitorKey: row.visitorKey,
    status,
    userRole: userRole ? String(userRole) : null,
    userRoleLabel: userRole ? roleLabel(userRole) : "Visitor profile",
    hasLinkedAccount: Boolean(row.userId),
    joinedAt: row.createdAt.toISOString(),
    lastActiveAt: extras.lastActiveAt,
    commentCount: row._count.comments,
    postCount: extras.postCount,
    inAppEnabled: prefs.inApp === true,
    emailEnabled: prefs.email === true,
    newslettersEnabled: prefs.newsletters !== false,
    newPostsEnabled: prefs.newPosts !== false,
    mutedSpaceIds,
    mutedSpaceSlugs: mutedSpaceIds
      .map((id) => spaceSlugById.get(id))
      .filter((slug): slug is string => Boolean(slug)),
    unreadNotificationCount: extras.unreadNotificationCount,
    ...partnership,
  };
}

export async function getMemberDetailForAdmin(
  memberId: string,
): Promise<AdminMemberDetail | null> {
  const row = await prisma.communityMemberRecord.findUnique({
    where: { id: memberId },
    include: {
      user: {
        select: {
          email: true,
          role: true,
          communityNotificationPrefs: true,
          communityEngagementPrefs: true,
        },
      },
      _count: { select: { comments: true } },
    },
  });
  if (!row) return null;

  const userId = row.userId;
  const prefs = mergeNotificationPreferences(row.user?.communityNotificationPrefs);
  const partnership = partnershipFieldsFromRaw(row.user?.communityEngagementPrefs);

  const spaces = await prisma.communitySpaceRecord.findMany({
    where: { status: "published" },
    select: { id: true, slug: true, title: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });
  const spaceSlugById = new Map(spaces.map((s) => [s.id, s.slug]));

  const [commentLast, postCount, postLast, unreadCount] = await Promise.all([
    prisma.communityPostCommentRecord.aggregate({
      where: { memberId: row.id },
      _max: { createdAt: true },
    }),
    userId
      ? prisma.communityPostRecord.count({ where: { authorUserId: userId } })
      : Promise.resolve(0),
    userId
      ? prisma.communityPostRecord.aggregate({
          where: { authorUserId: userId },
          _max: { updatedAt: true },
        })
      : Promise.resolve({ _max: { updatedAt: null } }),
    userId
      ? prisma.communityNotificationRecord.count({
          where: { recipientUserId: userId, readAt: null },
        })
      : Promise.resolve(0),
  ]);

  const base = buildPortalRowForMember(row, spaceSlugById, {
    postCount,
    lastActiveAt: maxIso([
      row.updatedAt,
      commentLast._max.createdAt,
      postLast._max.updatedAt,
    ]),
    unreadNotificationCount: unreadCount,
  });

  const [comments, posts, emailDeliveries, notifications] = await Promise.all([
      prisma.communityPostCommentRecord.findMany({
        where: { memberId: row.id },
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          id: true,
          postId: true,
          body: true,
          createdAt: true,
          post: { select: { space: { select: { slug: true, title: true } } } },
        },
      }),
      userId
        ? prisma.communityPostRecord.findMany({
            where: { authorUserId: userId },
            orderBy: { createdAt: "desc" },
            take: 15,
            select: {
              id: true,
              title: true,
              status: true,
              publishedAt: true,
              createdAt: true,
              space: { select: { slug: true, title: true } },
            },
          })
        : Promise.resolve([]),
      userId
        ? prisma.missionHubEmailDeliveryRecord.findMany({
            where: { recipientUserId: userId },
            orderBy: { createdAt: "desc" },
            take: 25,
            select: {
              id: true,
              notificationKind: true,
              status: true,
              recipientEmail: true,
              dedupeKey: true,
              resendMessageId: true,
              errorMessage: true,
              createdAt: true,
              sentAt: true,
            },
          })
        : Promise.resolve([]),
      userId
        ? prisma.communityNotificationRecord.findMany({
            where: { recipientUserId: userId },
            orderBy: { createdAt: "desc" },
            take: 25,
            select: {
              id: true,
              type: true,
              title: true,
              readAt: true,
              createdAt: true,
            },
          })
        : Promise.resolve([]),
    ]);

  const mutedSet = new Set(prefs.mutedSpaceIds ?? []);
  const publishedSpaces = spaces.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
  }));

  return {
    ...base,
    bio: row.bio,
    notificationPreferences: prefs,
    partnershipPreferences: mergePartnershipPreferences(row.user?.communityEngagementPrefs),
    mutedSpaces: publishedSpaces.filter((s) => mutedSet.has(s.id)),
    publishedSpaces,
    recentComments: comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      spaceSlug: c.post.space.slug,
      spaceTitle: c.post.space.title,
    })),
    recentPosts: posts.map((p) => ({
      id: p.id,
      title: p.title,
      spaceSlug: p.space.slug,
      spaceTitle: p.space.title,
      status: p.status,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
    emailDeliveries: emailDeliveries.map((d) => ({
      id: d.id,
      notificationKind: d.notificationKind,
      status: d.status,
      recipientEmail: d.recipientEmail,
      dedupeKey: d.dedupeKey,
      resendMessageId: d.resendMessageId,
      errorMessage: d.errorMessage,
      createdAt: d.createdAt.toISOString(),
      sentAt: d.sentAt?.toISOString() ?? null,
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

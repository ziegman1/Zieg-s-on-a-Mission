import { auth } from "@/auth";
import { isAdminRole } from "@/lib/admin-users";
import type { CommunityNotificationType } from "@/lib/community/notification-types";
import { isCommunityNotificationType } from "@/lib/community/notification-types";
import {
  isVoicePrayerBody,
  prayerResponseNotificationExcerpt,
} from "@/lib/community/prayer-response-body";
import { prisma } from "@/lib/db";

const OWNER_ROLES = ["ADMIN", "STAFF"] as const;

export async function listOwnerRecipientUserIds(): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { role: { in: [...OWNER_ROLES] } },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function requireNotificationRecipientUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  return prisma.communityNotificationRecord.count({
    where: { recipientUserId: userId, readAt: null },
  });
}

function buildNotificationHref(spaceSlug: string | null, postId: string | null): string {
  if (spaceSlug && postId) return `/community/${spaceSlug}#post-${postId}`;
  if (spaceSlug) return `/community/${spaceSlug}`;
  return "/community";
}

function recordToItem(row: {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: Date | null;
  createdAt: Date;
  postId: string | null;
  commentId: string | null;
  post: { space: { slug: string } } | null;
}): import("@/lib/community/notification-types").CommunityNotificationItem | null {
  if (!isCommunityNotificationType(row.type)) return null;
  const spaceSlug = row.post?.space.slug ?? null;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    postId: row.postId,
    commentId: row.commentId,
    spaceSlug,
    href: buildNotificationHref(spaceSlug, row.postId),
  };
}

export async function listRecentNotificationsForUser(
  userId: string,
  limit = 30,
): Promise<import("@/lib/community/notification-types").CommunityNotificationItem[]> {
  const rows = await prisma.communityNotificationRecord.findMany({
    where: { recipientUserId: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      post: { select: { space: { select: { slug: true } } } },
    },
  });

  return rows
    .map(recordToItem)
    .filter((n): n is NonNullable<typeof n> => n !== null);
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<boolean> {
  const result = await prisma.communityNotificationRecord.updateMany({
    where: { id: notificationId, recipientUserId: userId },
    data: { readAt: new Date() },
  });
  return result.count > 0;
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const result = await prisma.communityNotificationRecord.updateMany({
    where: { recipientUserId: userId, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}

type CreateNotificationInput = {
  recipientUserId: string;
  type: CommunityNotificationType;
  title: string;
  body?: string | null;
  actorUserId?: string | null;
  actorMemberId?: string | null;
  postId?: string | null;
  commentId?: string | null;
};

async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (input.actorUserId && input.actorUserId === input.recipientUserId) return;

  try {
    await prisma.communityNotificationRecord.create({
      data: {
        recipientUserId: input.recipientUserId,
        actorUserId: input.actorUserId ?? null,
        actorMemberId: input.actorMemberId ?? null,
        postId: input.postId ?? null,
        commentId: input.commentId ?? null,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
      },
    });
  } catch (e) {
    // Unique constraint on (recipient, comment_id) — skip duplicate
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002") {
      return;
    }
    console.error("[notifications] create failed:", e);
  }
}

async function createNotificationsForOwners(
  inputs: Omit<CreateNotificationInput, "recipientUserId">[],
  excludeUserIds: string[] = [],
): Promise<void> {
  const ownerIds = await listOwnerRecipientUserIds();
  const exclude = new Set(excludeUserIds);

  for (const ownerId of ownerIds) {
    if (exclude.has(ownerId)) continue;
    for (const input of inputs) {
      await createNotification({ ...input, recipientUserId: ownerId });
    }
  }
}

async function getPostContext(postId: string): Promise<{
  postTitle: string | null;
  spaceTitle: string;
} | null> {
  const post = await prisma.communityPostRecord.findFirst({
    where: { id: postId, status: "published", space: { status: "published" } },
    select: {
      title: true,
      space: { select: { title: true } },
    },
  });
  if (!post) return null;
  return {
    postTitle: post.title,
    spaceTitle: post.space.title,
  };
}

function truncateBody(text: string, max = 120): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/** Owners/admins notified on member comments (and replies). Members notified on replies to their comment. */
export async function notifyCommentActivity(input: {
  commentId: string;
  postId: string;
  parentCommentId: string | null;
  body: string;
  actorUserId: string | null;
  actorMemberId: string | null;
  actorDisplayName: string;
  actorIsOwner: boolean;
}): Promise<void> {
  const ctx = await getPostContext(input.postId);
  if (!ctx) return;

  const postLabel = ctx.postTitle?.trim() || "a post";
  const isVoice = isVoicePrayerBody(input.body);
  const excerpt = isVoice
    ? "Voice prayer"
    : truncateBody(prayerResponseNotificationExcerpt(input.body));
  const exclude = input.actorUserId ? [input.actorUserId] : [];

  const memberCommentTitle = isVoice
    ? `${input.actorDisplayName} shared a voice prayer`
    : input.parentCommentId
      ? `${input.actorDisplayName} replied on ${postLabel}`
      : `${input.actorDisplayName} commented on ${postLabel}`;

  const replyTitle = isVoice
    ? `${input.actorDisplayName} shared a voice prayer`
    : `${input.actorDisplayName} replied to your comment`;

  if (input.parentCommentId) {
    const parent = await prisma.communityPostCommentRecord.findFirst({
      where: { id: input.parentCommentId },
      select: {
        member: { select: { userId: true } },
      },
    });
    const parentUserId = parent?.member?.userId ?? null;
    if (parentUserId && parentUserId !== input.actorUserId) {
      await createNotification({
        recipientUserId: parentUserId,
        type: "reply_to_comment",
        title: replyTitle,
        body: excerpt,
        actorUserId: input.actorUserId,
        actorMemberId: input.actorMemberId,
        postId: input.postId,
        commentId: input.commentId,
      });
    }
  }

  if (!input.actorIsOwner) {
    await createNotificationsForOwners(
      [
        {
          type: "comment_on_post",
          title: memberCommentTitle,
          body: excerpt,
          actorUserId: input.actorUserId,
          actorMemberId: input.actorMemberId,
          postId: input.postId,
          commentId: input.commentId,
        },
      ],
      exclude,
    );
  }
}

const REACTION_LABELS: Record<string, string> = {
  like: "is standing with you",
  love: "is praying with you",
  prayed: "said amen",
  celebrating: "is rejoicing",
  encouraged: "was encouraged",
  pray: "prayed",
  amen: "said amen",
  celebrate: "celebrated",
};

/** Owners notified when a reaction is added (not removed). */
export async function notifyReactionAdded(input: {
  postId: string;
  reactionType: string;
  actorUserId: string | null;
  actorMemberId: string | null;
  actorDisplayName: string;
  actorIsOwner: boolean;
}): Promise<void> {
  if (input.actorIsOwner) return;

  const ctx = await getPostContext(input.postId);
  if (!ctx) return;

  const postLabel = ctx.postTitle?.trim() || "a post";
  const reactionLabel = REACTION_LABELS[input.reactionType] ?? "reacted to";

  const ownerIds = await listOwnerRecipientUserIds();
  const exclude = new Set(input.actorUserId ? [input.actorUserId] : []);

  for (const ownerId of ownerIds) {
    if (exclude.has(ownerId)) continue;

    const duplicate = await prisma.communityNotificationRecord.findFirst({
      where: {
        recipientUserId: ownerId,
        postId: input.postId,
        type: "reaction_on_post",
        actorMemberId: input.actorMemberId ?? undefined,
        actorUserId: input.actorUserId ?? undefined,
        readAt: null,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (duplicate) continue;

    await createNotification({
      recipientUserId: ownerId,
      type: "reaction_on_post",
      title: `${input.actorDisplayName} ${reactionLabel} ${postLabel}`,
      body: ctx.spaceTitle,
      actorUserId: input.actorUserId,
      actorMemberId: input.actorMemberId,
      postId: input.postId,
    });
  }
}

/** Owners notified when a new member joins Mission Hub. */
export async function notifyMemberJoined(input: {
  memberId: string;
  userId: string;
  displayName: string;
}): Promise<void> {
  const ownerIds = await listOwnerRecipientUserIds();
  const exclude = new Set([input.userId]);

  for (const ownerId of ownerIds) {
    if (exclude.has(ownerId)) continue;
    const existing = await prisma.communityNotificationRecord.findFirst({
      where: {
        recipientUserId: ownerId,
        type: "member_joined",
        actorMemberId: input.memberId,
      },
      select: { id: true },
    });
    if (existing) continue;

    await createNotification({
      recipientUserId: ownerId,
      type: "member_joined",
      title: `${input.displayName} joined Mission Hub`,
      body: "A new member created an account.",
      actorUserId: input.userId,
      actorMemberId: input.memberId,
    });
  }
}

/** Resolve actor display name from member or visitor key. */
export async function resolveReactionActor(visitorKey: string): Promise<{
  actorUserId: string | null;
  actorMemberId: string | null;
  actorDisplayName: string;
  actorIsOwner: boolean;
}> {
  const session = await auth();
  if (session?.user?.id && isAdminRole(session.user.role)) {
    return {
      actorUserId: session.user.id,
      actorMemberId: null,
      actorDisplayName:
        session.user.name?.trim() || session.user.email?.split("@")[0] || "Owner",
      actorIsOwner: true,
    };
  }

  const member = await prisma.communityMemberRecord.findFirst({
    where: { visitorKey },
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
    },
  });

  if (member) {
    return {
      actorUserId: member.userId,
      actorMemberId: member.id,
      actorDisplayName: `${member.firstName.trim()} ${member.lastName.trim()}`.trim(),
      actorIsOwner: false,
    };
  }

  return {
    actorUserId: session?.user?.id ?? null,
    actorMemberId: null,
    actorDisplayName: "Someone",
    actorIsOwner: false,
  };
}

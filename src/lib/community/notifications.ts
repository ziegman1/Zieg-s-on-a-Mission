import { auth } from "@/auth";
import { isAdminRole } from "@/lib/admin-users";
import type { CommunityNotificationType } from "@/lib/community/notification-types";
import {
  isVoicePrayerBody,
  prayerResponseNotificationExcerpt,
} from "@/lib/community/prayer-response-body";
import { prisma } from "@/lib/db";
import { blogPublishNotificationDedupeKey } from "@/lib/blog/mission-hub-dedupe";
import { mapNotificationRecordToItem } from "@/lib/community/notification-record-mapper";
import {
  BLOG_PUBLISHED_NOTIFICATION_TITLE,
  BLOG_PUBLISHED_NOTIFICATION_TYPE,
  NEWSLETTER_PUBLISHED_NOTIFICATION_TITLE,
  NEWSLETTER_PUBLISHED_NOTIFICATION_TYPE,
  URGENT_PRAYER_REQUEST_NOTIFICATION_TITLE,
  URGENT_PRAYER_REQUEST_NOTIFICATION_TYPE,
} from "@/lib/community/notification-type-constants";
import { urgentPrayerPublishNotificationDedupeKey } from "@/lib/community/urgent-prayer-dedupe";
import {
  newPostPublishNotificationDedupeKey,
  newsletterPublishNotificationDedupeKey,
} from "@/lib/newsletter/mission-hub-dedupe";

export {
  BLOG_PUBLISHED_NOTIFICATION_TITLE,
  BLOG_PUBLISHED_NOTIFICATION_TYPE,
  NEWSLETTER_PUBLISHED_NOTIFICATION_TITLE,
  NEWSLETTER_PUBLISHED_NOTIFICATION_TYPE,
  URGENT_PRAYER_REQUEST_NOTIFICATION_TITLE,
  URGENT_PRAYER_REQUEST_NOTIFICATION_TYPE,
} from "@/lib/community/notification-type-constants";

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

export type NotificationsListForUser = {
  unread: import("@/lib/community/notification-types").CommunityNotificationItem[];
  read: import("@/lib/community/notification-types").CommunityNotificationItem[];
};

export async function listRecentNotificationsForUser(
  userId: string,
  limit = 50,
): Promise<import("@/lib/community/notification-types").CommunityNotificationItem[]> {
  const grouped = await listNotificationsGroupedForUser(userId, limit);
  return [...grouped.unread, ...grouped.read];
}

/** Unread first, then read — for bell panel sections. */
export async function listNotificationsGroupedForUser(
  userId: string,
  limit = 50,
): Promise<NotificationsListForUser> {
  await pruneStaleReadNotifications(userId);

  const rows = await prisma.communityNotificationRecord.findMany({
    where: { recipientUserId: userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      post: { select: { status: true, space: { select: { slug: true } } } },
    },
  });

  const items = rows
    .map(mapNotificationRecordToItem)
    .filter((n): n is NonNullable<typeof n> => n !== null);

  const unread: NotificationsListForUser["unread"] = [];
  const read: NotificationsListForUser["read"] = [];
  for (const item of items) {
    if (item.readAt) read.push(item);
    else unread.push(item);
  }

  if (
    process.env.NEWSLETTER_HUB_DEBUG === "1" ||
    process.env.NODE_ENV !== "production"
  ) {
    console.info("[notifications] listNotificationsGroupedForUser", {
      userId,
      unreadCount: unread.length,
      readCount: read.length,
      totalRows: rows.length,
    });
  }

  return { unread, read };
}

const READ_NOTIFICATION_RETENTION_DAYS = 30;

async function pruneStaleReadNotifications(userId: string): Promise<void> {
  const cutoff = new Date(
    Date.now() - READ_NOTIFICATION_RETENTION_DAYS * 86_400_000,
  );
  await prisma.communityNotificationRecord
    .deleteMany({
      where: {
        recipientUserId: userId,
        readAt: { not: null, lt: cutoff },
      },
    })
    .catch(() => {});
}

export async function deleteReadNotificationsForUser(userId: string): Promise<number> {
  const result = await prisma.communityNotificationRecord.deleteMany({
    where: {
      recipientUserId: userId,
      readAt: { not: null },
    },
  });
  return result.count;
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

export { newsletterPublishNotificationDedupeKey } from "@/lib/newsletter/mission-hub-dedupe";

export type NewsletterPublishedNotificationMetadata = {
  sourceKind: "newsletter";
  sourceId: string;
  sourcePostId: string;
  newsletterSlug: string;
  newsletterPath: string;
  missionHubSpaceSlug: string;
  ministryUpdatesPostId?: string;
  ministryUpdatesSpaceSlug?: string;
  newsletterSpacePostId?: string | null;
};

export function buildNewsletterPublishedNotificationBody(
  excerpt: string,
  subtitle: string,
): string {
  const text = excerpt.trim() || subtitle.trim();
  return text || "A new ministry update is available.";
}

/** Create or refresh a deduped in-app notification when a newsletter is published. */
export async function upsertNewsletterPublishedNotification(input: {
  recipientUserId: string;
  newsletterId: string;
  newsletterSlug: string;
  newsletterPath: string;
  body: string;
  sourcePostId: string;
  missionHubSpaceSlug: string;
  ministryUpdatesPostId: string;
  ministryUpdatesSpaceSlug: string;
  newsletterSpacePostId?: string | null;
  actorUserId?: string | null;
}): Promise<"created" | "updated"> {
  if (input.actorUserId && input.actorUserId === input.recipientUserId) {
    return "updated";
  }

  const dedupeKey = newsletterPublishNotificationDedupeKey(input.newsletterId);
  const metadata: NewsletterPublishedNotificationMetadata = {
    sourceKind: "newsletter",
    sourceId: input.newsletterId,
    sourcePostId: input.sourcePostId,
    newsletterSlug: input.newsletterSlug,
    newsletterPath: input.newsletterPath,
    missionHubSpaceSlug: input.missionHubSpaceSlug,
    ministryUpdatesPostId: input.ministryUpdatesPostId,
    ministryUpdatesSpaceSlug: input.ministryUpdatesSpaceSlug,
    newsletterSpacePostId: input.newsletterSpacePostId ?? null,
  };

  const existing = await prisma.communityNotificationRecord.findFirst({
    where: {
      recipientUserId: input.recipientUserId,
      dedupeKey,
    },
    select: { id: true },
  });

  const data = {
    type: NEWSLETTER_PUBLISHED_NOTIFICATION_TYPE,
    title: NEWSLETTER_PUBLISHED_NOTIFICATION_TITLE,
    body: input.body,
    postId: input.sourcePostId,
    commentId: null,
    actorUserId: input.actorUserId ?? null,
    actorMemberId: null,
    dedupeKey,
    metadata: metadata as unknown as import("@prisma/client").Prisma.InputJsonValue,
    readAt: null,
  };

  if (existing) {
    await prisma.communityNotificationRecord.update({
      where: { id: existing.id },
      data: { ...data, readAt: null, createdAt: new Date() },
    });
    if (
      process.env.NEWSLETTER_HUB_DEBUG === "1" ||
      process.env.NODE_ENV !== "production"
    ) {
      console.info("[notifications] upsertNewsletterPublishedNotification updated", {
        recipientUserId: input.recipientUserId,
        newsletterId: input.newsletterId,
        dedupeKey,
      });
    }
    return "updated";
  }

  if (
    process.env.NEWSLETTER_HUB_DEBUG === "1" ||
    process.env.NODE_ENV !== "production"
  ) {
    console.info("[notifications] upsertNewsletterPublishedNotification created", {
      recipientUserId: input.recipientUserId,
      newsletterId: input.newsletterId,
      dedupeKey,
      sourcePostId: input.sourcePostId,
    });
  }

  await prisma.communityNotificationRecord.create({
    data: {
      recipientUserId: input.recipientUserId,
      ...data,
    },
  });
  return "created";
}

export { blogPublishNotificationDedupeKey } from "@/lib/blog/mission-hub-dedupe";

export type BlogPublishedNotificationMetadata = {
  sourceKind: "blog";
  sourceId: string;
  sourcePostId: string;
  blogSlug: string;
  blogPath: string;
  missionHubSpaceSlug: string;
};

export function buildBlogPublishedNotificationBody(excerpt: string, body: string): string {
  const text = excerpt.trim() || body.trim().split(/\n\n+/)[0]?.trim().slice(0, 200) || "";
  return text || "A new blog article is available.";
}

/** Create or refresh a deduped in-app notification when a blog article is published. */
export async function upsertBlogPublishedNotification(input: {
  recipientUserId: string;
  blogPostId: string;
  blogSlug: string;
  blogPath: string;
  body: string;
  sourcePostId: string;
  missionHubSpaceSlug: string;
  actorUserId?: string | null;
}): Promise<"created" | "updated"> {
  if (input.actorUserId && input.actorUserId === input.recipientUserId) {
    return "updated";
  }

  const dedupeKey = blogPublishNotificationDedupeKey(input.blogPostId);
  const metadata: BlogPublishedNotificationMetadata = {
    sourceKind: "blog",
    sourceId: input.blogPostId,
    sourcePostId: input.sourcePostId,
    blogSlug: input.blogSlug,
    blogPath: input.blogPath,
    missionHubSpaceSlug: input.missionHubSpaceSlug,
  };

  const existing = await prisma.communityNotificationRecord.findFirst({
    where: {
      recipientUserId: input.recipientUserId,
      dedupeKey,
    },
    select: { id: true },
  });

  const data = {
    type: BLOG_PUBLISHED_NOTIFICATION_TYPE,
    title: BLOG_PUBLISHED_NOTIFICATION_TITLE,
    body: input.body,
    postId: input.sourcePostId,
    commentId: null,
    actorUserId: input.actorUserId ?? null,
    actorMemberId: null,
    dedupeKey,
    metadata: metadata as unknown as import("@prisma/client").Prisma.InputJsonValue,
    readAt: null,
  };

  if (existing) {
    await prisma.communityNotificationRecord.update({
      where: { id: existing.id },
      data: { ...data, readAt: null, createdAt: new Date() },
    });
    return "updated";
  }

  await prisma.communityNotificationRecord.create({
    data: {
      recipientUserId: input.recipientUserId,
      ...data,
    },
  });
  return "created";
}

export function buildNewPostPublishedNotificationTitle(spaceName: string): string {
  return `New post in ${spaceName.trim() || "Mission Hub"}`;
}

/** Deduped in-app notification when a Mission Hub post is published. */
export async function upsertNewPostPublishedNotification(input: {
  recipientUserId: string;
  postId: string;
  spaceId: string;
  spaceSlug: string;
  spaceName: string;
  title: string | null;
  body: string;
  excerpt: string | null;
  actorUserId?: string | null;
}): Promise<"created" | "updated"> {
  if (input.actorUserId && input.actorUserId === input.recipientUserId) {
    return "updated";
  }

  const dedupeKey = newPostPublishNotificationDedupeKey(input.postId);
  const headline =
    input.title?.trim() ||
    input.excerpt?.trim() ||
    input.body.trim().slice(0, 120) ||
    "New update";
  const notificationBody = input.excerpt?.trim() || input.body.trim().slice(0, 200) || null;

  const metadata = {
    sourceKind: "post",
    sourceId: input.postId,
    sourcePostId: input.postId,
    spaceId: input.spaceId,
    spaceSlug: input.spaceSlug,
  } satisfies Record<string, string>;

  const existing = await prisma.communityNotificationRecord.findFirst({
    where: { recipientUserId: input.recipientUserId, dedupeKey },
    select: { id: true },
  });

  const data = {
    type: "new_post" as const,
    title: buildNewPostPublishedNotificationTitle(input.spaceName),
    body: notificationBody,
    postId: input.postId,
    commentId: null,
    actorUserId: input.actorUserId ?? null,
    actorMemberId: null,
    dedupeKey,
    metadata: metadata as unknown as import("@prisma/client").Prisma.InputJsonValue,
    readAt: null,
  };

  if (existing) {
    await prisma.communityNotificationRecord.update({
      where: { id: existing.id },
      data: { ...data, readAt: null, createdAt: new Date() },
    });
    return "updated";
  }

  await prisma.communityNotificationRecord.create({
    data: {
      recipientUserId: input.recipientUserId,
      ...data,
    },
  });
  return "created";
}

export { urgentPrayerPublishNotificationDedupeKey } from "@/lib/community/urgent-prayer-dedupe";

export function buildUrgentPrayerPublishedNotificationBody(
  title: string | null,
  excerpt: string | null,
  body: string,
): string {
  const headline = title?.trim() || "We are asking for your prayers.";
  const preview =
    excerpt?.trim() || body.trim().slice(0, 200) || "Please join us in prayer in Mission Hub.";
  return `${headline}\n\n${preview}`;
}

/** Create or refresh a deduped in-app notification for an urgent prayer request. */
export async function upsertUrgentPrayerRequestNotification(input: {
  recipientUserId: string;
  postId: string;
  spaceId: string;
  spaceSlug: string;
  body: string;
  actorUserId?: string | null;
}): Promise<"created" | "updated"> {
  if (input.actorUserId && input.actorUserId === input.recipientUserId) {
    return "updated";
  }

  const dedupeKey = urgentPrayerPublishNotificationDedupeKey(input.postId);
  const metadata = {
    sourceKind: "post",
    sourceId: input.postId,
    sourcePostId: input.postId,
    spaceId: input.spaceId,
    spaceSlug: input.spaceSlug,
    urgentPrayerRequest: true,
  } satisfies Record<string, string | boolean>;

  const existing = await prisma.communityNotificationRecord.findFirst({
    where: { recipientUserId: input.recipientUserId, dedupeKey },
    select: { id: true },
  });

  const data = {
    type: URGENT_PRAYER_REQUEST_NOTIFICATION_TYPE,
    title: URGENT_PRAYER_REQUEST_NOTIFICATION_TITLE,
    body: input.body,
    postId: input.postId,
    commentId: null,
    actorUserId: input.actorUserId ?? null,
    actorMemberId: null,
    dedupeKey,
    metadata: metadata as unknown as import("@prisma/client").Prisma.InputJsonValue,
    readAt: null,
  };

  if (existing) {
    await prisma.communityNotificationRecord.update({
      where: { id: existing.id },
      data: { ...data, readAt: null, createdAt: new Date() },
    });
    return "updated";
  }

  await prisma.communityNotificationRecord.create({
    data: {
      recipientUserId: input.recipientUserId,
      ...data,
    },
  });
  return "created";
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

/** Owners notified when someone shares from the Prayer & Praise Room welcome CTAs. */
export async function notifyPrayerRoomPostCreated(input: {
  postId: string;
  kind:
    | "prayer_request"
    | "praise_report"
    | "encouragement"
    | "voice_prayer";
  actorUserId: string;
  actorMemberId: string | null;
  actorDisplayName: string;
  actorIsOwner: boolean;
}): Promise<void> {
  if (input.actorIsOwner) return;

  const ctx = await getPostContext(input.postId);
  if (!ctx) return;

  const titleByKind: Record<typeof input.kind, string> = {
    prayer_request: `${input.actorDisplayName} shared a prayer request`,
    praise_report: `${input.actorDisplayName} shared a praise report`,
    encouragement: `${input.actorDisplayName} left encouragement`,
    voice_prayer: `${input.actorDisplayName} shared a voice prayer`,
  };

  const exclude = [input.actorUserId];
  await createNotificationsForOwners(
    [
      {
        type: "new_post",
        title: titleByKind[input.kind],
        body: ctx.postTitle?.trim() || ctx.spaceTitle,
        actorUserId: input.actorUserId,
        actorMemberId: input.actorMemberId,
        postId: input.postId,
      },
    ],
    exclude,
  );
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

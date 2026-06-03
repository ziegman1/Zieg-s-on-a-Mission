import type { CommunityNotificationItem } from "@/lib/community/notification-types";
import { isCommunityNotificationType } from "@/lib/community/notification-types";
import {
  BLOG_PUBLISHED_NOTIFICATION_TYPE,
  NEWSLETTER_PUBLISHED_NOTIFICATION_TYPE,
  URGENT_PRAYER_REQUEST_NOTIFICATION_TYPE,
} from "@/lib/community/notification-type-constants";
import { shouldIncludeAdvancedNotificationType } from "@/lib/mission-hub/advanced-notifications-config";

export type NotificationRecordRow = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: Date | null;
  createdAt: Date;
  postId: string | null;
  commentId: string | null;
  metadata: unknown;
  post: { status: string; space: { slug: string } | null } | null;
};

function buildNotificationHref(spaceSlug: string | null, postId: string | null): string {
  if (spaceSlug && postId) return `/community/${spaceSlug}#post-${postId}`;
  if (spaceSlug) return `/community/${spaceSlug}`;
  return "/community";
}

function parseNewsletterPublishedMetadata(metadata: unknown): {
  sourceKind: "newsletter";
  sourcePostId: string;
  newsletterPath: string;
  missionHubSpaceSlug: string;
  ministryUpdatesPostId?: string;
  ministryUpdatesSpaceSlug?: string;
} | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const m = metadata as Record<string, unknown>;
  if (m.sourceKind !== "newsletter") return null;
  const newsletterPath =
    typeof m.newsletterPath === "string" && m.newsletterPath.trim()
      ? m.newsletterPath.trim()
      : null;
  if (!newsletterPath) return null;
  return {
    sourceKind: "newsletter",
    sourcePostId: typeof m.sourcePostId === "string" ? m.sourcePostId : "",
    newsletterPath,
    missionHubSpaceSlug:
      typeof m.missionHubSpaceSlug === "string" ? m.missionHubSpaceSlug : "",
    ministryUpdatesPostId:
      typeof m.ministryUpdatesPostId === "string" ? m.ministryUpdatesPostId : undefined,
    ministryUpdatesSpaceSlug:
      typeof m.ministryUpdatesSpaceSlug === "string"
        ? m.ministryUpdatesSpaceSlug
        : undefined,
  };
}

function buildNewsletterNotificationHref(row: NotificationRecordRow): string {
  const meta = parseNewsletterPublishedMetadata(row.metadata);
  const postSpaceSlug = row.post?.space?.slug ?? null;
  if (row.post?.status === "published" && postSpaceSlug && row.postId) {
    return buildNotificationHref(postSpaceSlug, row.postId);
  }
  if (
    meta?.ministryUpdatesSpaceSlug &&
    meta.ministryUpdatesPostId &&
    row.postId === meta.ministryUpdatesPostId
  ) {
    return buildNotificationHref(meta.ministryUpdatesSpaceSlug, meta.ministryUpdatesPostId);
  }
  if (meta?.missionHubSpaceSlug && meta.sourcePostId) {
    return buildNotificationHref(meta.missionHubSpaceSlug, meta.sourcePostId);
  }
  return meta?.newsletterPath ?? "/community";
}

function parseBlogPublishedMetadata(metadata: unknown): {
  sourceKind: "blog";
  sourcePostId: string;
  blogPath: string;
  missionHubSpaceSlug: string;
} | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const m = metadata as Record<string, unknown>;
  if (m.sourceKind !== "blog") return null;
  const blogPath =
    typeof m.blogPath === "string" && m.blogPath.trim() ? m.blogPath.trim() : null;
  if (!blogPath) return null;
  return {
    sourceKind: "blog",
    sourcePostId: typeof m.sourcePostId === "string" ? m.sourcePostId : "",
    blogPath,
    missionHubSpaceSlug:
      typeof m.missionHubSpaceSlug === "string" ? m.missionHubSpaceSlug : "",
  };
}

function buildBlogNotificationHref(row: NotificationRecordRow): string {
  const meta = parseBlogPublishedMetadata(row.metadata);
  const postSpaceSlug = row.post?.space?.slug ?? null;
  if (row.post?.status === "published" && postSpaceSlug && row.postId) {
    return buildNotificationHref(postSpaceSlug, row.postId);
  }
  if (meta?.missionHubSpaceSlug && meta.sourcePostId) {
    return buildNotificationHref(meta.missionHubSpaceSlug, meta.sourcePostId);
  }
  return meta?.blogPath ?? "/blog";
}

function buildNotificationHrefForType(row: NotificationRecordRow): string {
  const spaceSlug = row.post?.space?.slug ?? null;
  switch (row.type) {
    case NEWSLETTER_PUBLISHED_NOTIFICATION_TYPE:
      return buildNewsletterNotificationHref(row);
    case BLOG_PUBLISHED_NOTIFICATION_TYPE:
      return buildBlogNotificationHref(row);
    case URGENT_PRAYER_REQUEST_NOTIFICATION_TYPE:
    default:
      return buildNotificationHref(spaceSlug, row.postId);
  }
}

/** Map a DB notification row to a feed item; never throws. */
export function mapNotificationRecordToItem(row: NotificationRecordRow): CommunityNotificationItem | null {
  try {
    if (!isCommunityNotificationType(row.type)) return null;
    if (!shouldIncludeAdvancedNotificationType(row.type)) return null;

    const spaceSlug = row.post?.space?.slug ?? null;
    const href = buildNotificationHrefForType(row);

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
      href,
    };
  } catch (e) {
    console.warn("[notifications] mapNotificationRecordToItem skipped row", {
      id: row.id,
      type: row.type,
      error: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

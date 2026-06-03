import { prisma } from "@/lib/db";
import { blogPublishEmailDedupeKey } from "@/lib/mission-hub/email-dedupe";
import { blogPublishNotificationDedupeKey } from "./mission-hub-dedupe";
import {
  BLOG_SOURCE_KIND,
  archiveMissionHubBlogAnnouncement,
} from "./mission-hub-announcement";

export type BlogMissionHubPostDiagnostic = {
  id: string;
  spaceId: string;
  spaceSlug: string | null;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
};

export type BlogMissionHubDiagnostics = {
  blogPostId: string;
  posts: BlogMissionHubPostDiagnostic[];
  inAppNotificationCount: number;
  emailDeliveryCount: number;
  emailDeliveryByStatus: Record<string, number>;
  notificationDedupeKey: string;
  emailDedupeKey: string;
};

/** Admin diagnostics for blog Mission Hub delivery state. */
export async function getBlogMissionHubDiagnostics(
  blogPostId: string,
): Promise<BlogMissionHubDiagnostics> {
  const notificationDedupeKey = blogPublishNotificationDedupeKey(blogPostId);
  const emailDedupeKey = blogPublishEmailDedupeKey(blogPostId);

  const [posts, inAppNotificationCount, emailRows] = await Promise.all([
    prisma.communityPostRecord.findMany({
      where: {
        sourceKind: BLOG_SOURCE_KIND,
        sourceId: blogPostId,
      },
      select: {
        id: true,
        spaceId: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        space: { select: { slug: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.communityNotificationRecord.count({
      where: { dedupeKey: notificationDedupeKey },
    }),
    prisma.missionHubEmailDeliveryRecord.findMany({
      where: { dedupeKey: emailDedupeKey },
      select: { status: true },
    }),
  ]);

  const emailDeliveryByStatus: Record<string, number> = {};
  for (const row of emailRows) {
    emailDeliveryByStatus[row.status] = (emailDeliveryByStatus[row.status] ?? 0) + 1;
  }

  return {
    blogPostId,
    posts: posts.map((p) => ({
      id: p.id,
      spaceId: p.spaceId,
      spaceSlug: p.space.slug,
      status: p.status,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      updatedAt: p.updatedAt.toISOString(),
    })),
    inAppNotificationCount,
    emailDeliveryCount: emailRows.length,
    emailDeliveryByStatus,
    notificationDedupeKey,
    emailDedupeKey,
  };
}

export async function removeBlogFromMissionHub(blogPostId: string): Promise<{
  postsArchived: number;
  notificationsDeleted: number;
  emailDeliveriesDeleted: number;
}> {
  const postsArchived = await archiveMissionHubBlogAnnouncement(blogPostId);

  const notificationResult = await prisma.communityNotificationRecord.deleteMany({
    where: { dedupeKey: blogPublishNotificationDedupeKey(blogPostId) },
  });

  const emailResult = await prisma.missionHubEmailDeliveryRecord.deleteMany({
    where: { dedupeKey: blogPublishEmailDedupeKey(blogPostId) },
  });

  return {
    postsArchived,
    notificationsDeleted: notificationResult.count,
    emailDeliveriesDeleted: emailResult.count,
  };
}

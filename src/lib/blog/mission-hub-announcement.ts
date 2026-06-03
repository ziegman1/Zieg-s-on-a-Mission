import type { Prisma } from "@prisma/client";
import { spaceFormDataFromInput } from "@/lib/community/space-form";
import { mergeSpaceSettingsWithNotificationCategory } from "@/lib/community/space-notification-category";
import { resolveSortOrderForNewSpace } from "@/lib/community/space-order";
import { buildCompactSpaceCreatePayload } from "@/lib/community/compact-space-create-payload";
import { prisma } from "@/lib/db";
import type { BlogPostRecord } from "./types";

export const BLOG_SOURCE_KIND = "blog" as const;
export const BLOG_ARTICLES_SPACE_SLUG = "blog-articles";

export type BlogAnnouncementMetadata = {
  kind: "blog_announcement";
  blogPostId: string;
  blogSlug: string;
  blogPath: string;
};

export type UpsertMissionHubBlogAnnouncementResult = {
  postId: string;
  spaceSlug: string;
  spaceId: string;
  created: boolean;
  blogPath: string;
  spaceCreated: boolean;
};

export function blogPublicPath(slug: string): string {
  return `/blog/${slug.trim()}`;
}

function firstParagraph(body: string): string {
  const paragraph = body
    .trim()
    .split(/\n\n+/)
    .map((p) => p.trim())
    .find(Boolean);
  if (!paragraph) return "";
  return paragraph.length > 320 ? `${paragraph.slice(0, 317).trim()}…` : paragraph;
}

export function buildBlogAnnouncementBody(blog: BlogPostRecord): string {
  const path = blogPublicPath(blog.slug);
  const intro = blog.excerpt.trim() || firstParagraph(blog.body);
  const lines: string[] = [];
  if (intro) lines.push(intro);
  lines.push("");
  lines.push(`Read the full article here: ${path}`);
  return lines.join("\n");
}

export function buildBlogAnnouncementMetadata(blog: BlogPostRecord): BlogAnnouncementMetadata {
  return {
    kind: "blog_announcement",
    blogPostId: blog.id,
    blogSlug: blog.slug,
    blogPath: blogPublicPath(blog.slug),
  };
}

function publishedAtFromBlog(blog: BlogPostRecord): Date {
  if (blog.publishedAt?.trim()) {
    const d = new Date(blog.publishedAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

/** Ensure Blog Articles space exists and is published. */
export async function ensureBlogArticlesSpace(): Promise<{
  id: string;
  slug: string;
  created: boolean;
}> {
  const existing = await prisma.communitySpaceRecord.findUnique({
    where: { slug: BLOG_ARTICLES_SPACE_SLUG },
  });

  if (existing?.status === "published") {
    return { id: existing.id, slug: existing.slug, created: false };
  }

  if (existing) {
    const row = await prisma.communitySpaceRecord.update({
      where: { id: existing.id },
      data: { status: "published" },
      select: { id: true, slug: true },
    });
    return { id: row.id, slug: row.slug, created: false };
  }

  const payload = buildCompactSpaceCreatePayload({
    title: "Blog Articles",
    icon: "blog",
  });
  const sortOrder = await resolveSortOrderForNewSpace(payload.slug);
  const row = await prisma.communitySpaceRecord.create({
    data: {
      ...spaceFormDataFromInput(payload),
      slug: payload.slug,
      sortOrder,
      settings: mergeSpaceSettingsWithNotificationCategory({}, payload.notificationCategory),
    },
    select: { id: true, slug: true },
  });

  return { id: row.id, slug: row.slug, created: true };
}

async function findExistingBlogAnnouncement(
  blogPostId: string,
  spaceId: string,
): Promise<{ id: string } | null> {
  return prisma.communityPostRecord.findFirst({
    where: {
      sourceKind: BLOG_SOURCE_KIND,
      sourceId: blogPostId,
      spaceId,
    },
    select: { id: true },
  });
}

/**
 * Create or refresh the Mission Hub announcement post for a published blog article.
 */
export async function upsertMissionHubBlogAnnouncement(
  blog: BlogPostRecord,
  publisherUserId: string | null,
): Promise<UpsertMissionHubBlogAnnouncementResult> {
  const space = await ensureBlogArticlesSpace();
  const metadata = buildBlogAnnouncementMetadata(blog);
  const data = {
    spaceId: space.id,
    authorUserId: publisherUserId,
    title: blog.title.trim(),
    body: buildBlogAnnouncementBody(blog),
    excerpt: blog.excerpt.trim() || null,
    postType: "blog",
    status: "published",
    coverImageUrl: blog.featuredImageUrl,
    sourceKind: BLOG_SOURCE_KIND,
    sourceId: blog.id,
    metadata: metadata as unknown as Prisma.InputJsonValue,
    publishedAt: publishedAtFromBlog(blog),
  };

  const existing = await findExistingBlogAnnouncement(blog.id, space.id);

  if (existing) {
    const row = await prisma.communityPostRecord.update({
      where: { id: existing.id },
      data,
      select: { id: true },
    });
    return {
      postId: row.id,
      spaceSlug: space.slug,
      spaceId: space.id,
      created: false,
      blogPath: metadata.blogPath,
      spaceCreated: space.created,
    };
  }

  const row = await prisma.communityPostRecord.create({
    data,
    select: { id: true },
  });

  return {
    postId: row.id,
    spaceSlug: space.slug,
    spaceId: space.id,
    created: true,
    blogPath: metadata.blogPath,
    spaceCreated: space.created,
  };
}

/** Hide Mission Hub announcements for a blog post. */
export async function archiveMissionHubBlogAnnouncement(blogPostId: string): Promise<number> {
  const result = await prisma.communityPostRecord.updateMany({
    where: {
      sourceKind: BLOG_SOURCE_KIND,
      sourceId: blogPostId,
      status: { not: "archived" },
    },
    data: { status: "archived" },
  });
  return result.count;
}

export function formatBlogPublishSuccessMessage(input: {
  blogSlug: string;
  hub: {
    announcement: UpsertMissionHubBlogAnnouncementResult;
    inAppNotificationsSent: number;
    inAppNotificationsUpdated: number;
    emailNotificationsSent: number;
    emailNotificationsDeduped?: number;
    emailEnabled: boolean;
  };
}): string {
  const { announcement } = input.hub;
  const lines = [
    "Blog published.",
    `Public page: ${blogPublicPath(input.blogSlug)}`,
    announcement.created
      ? `Mission Hub post created in /community/${announcement.spaceSlug}.`
      : `Mission Hub post updated in /community/${announcement.spaceSlug} (no duplicate).`,
  ];

  if (announcement.spaceCreated) {
    lines.push(`Blog Articles space was auto-created (${BLOG_ARTICLES_SPACE_SLUG}).`);
  }

  lines.push(
    `In-app: ${input.hub.inAppNotificationsSent} sent, ${input.hub.inAppNotificationsUpdated} updated.`,
  );

  if (input.hub.emailEnabled) {
    lines.push(
      `Email: ${input.hub.emailNotificationsSent} sent` +
        (input.hub.emailNotificationsDeduped
          ? `, ${input.hub.emailNotificationsDeduped} deduped`
          : "") +
        ".",
    );
  } else {
    lines.push("Email notifications are disabled on the server.");
  }

  return lines.join("\n");
}

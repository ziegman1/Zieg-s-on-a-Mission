"use server";

import { revalidatePath } from "next/cache";
import {
  deleteBlogPost,
  getBlogPostById,
  listBlogPostsForAdmin,
  saveBlogPost,
  validateBlogPostInput,
} from "@/lib/blog/blog-db";
import { formatBlogError, logBlogAction } from "@/lib/blog/errors";
import {
  archiveMissionHubBlogAnnouncement,
  formatBlogPublishSuccessMessage,
} from "@/lib/blog/mission-hub-announcement";
import { getBlogMissionHubDiagnostics } from "@/lib/blog/mission-hub-lifecycle";
import { notifyMissionHubMembersOfBlogPublish } from "@/lib/blog/notify";
import type { BlogNotifyResult } from "@/lib/blog/notify";
import { revalidateBlogPaths } from "@/lib/blog/revalidate";
import type { BlogPostInput, BlogPostRecord, BlogPostStatus } from "@/lib/blog/types";
import { requireAdminSession } from "@/lib/admin-auth";

export type BlogPostFormInput = {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
  status: BlogPostStatus;
  publishedAt: string | null;
};

function normalizeInput(input: BlogPostFormInput): BlogPostInput {
  return {
    id: input.id?.trim() || undefined,
    title: input.title.trim(),
    slug: input.slug.trim(),
    excerpt: input.excerpt.trim(),
    body: input.body,
    featuredImageUrl: input.featuredImageUrl?.trim() || null,
    featuredImageAlt: input.featuredImageAlt.trim(),
    status: input.status,
    publishedAt: input.publishedAt,
  };
}

function parsePublishedAt(value: string | null | undefined, intent: "draft" | "publish"): string | null {
  if (value?.trim()) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return intent === "publish" ? new Date().toISOString() : null;
}

function successMessage(
  intent: "draft" | "publish",
  hadExistingId: boolean,
  previousStatus?: BlogPostStatus,
): string {
  if (intent === "draft") return "Draft saved";
  if (hadExistingId && previousStatus === "PUBLISHED") return "Updated published post";
  return "Blog post published";
}

type BlogPublishHubSummary = {
  announcementPostId: string;
  announcementSpaceSlug: string;
  announcementCreated: boolean;
  blogPublicPath: string;
  notificationsPrepared: boolean;
  notify: BlogNotifyResult;
};

type SaveResult =
  | {
      ok: true;
      post: BlogPostRecord;
      message: string;
      hub?: BlogPublishHubSummary;
      hubWarning?: string;
    }
  | { ok: false; error: string };

async function persistBlogPost(
  input: BlogPostFormInput,
  intent: "draft" | "publish",
): Promise<SaveResult> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };

  const hadExistingId = Boolean(input.id?.trim());
  let previousStatus: BlogPostStatus | undefined;
  if (hadExistingId && input.id) {
    try {
      const existing = await getBlogPostById(input.id);
      previousStatus = existing?.status;
    } catch {
      /* ignore — save will surface errors */
    }
  }

  const status: BlogPostStatus = intent === "publish" ? "PUBLISHED" : "DRAFT";
  const normalized = normalizeInput({
    ...input,
    status,
    publishedAt: parsePublishedAt(input.publishedAt, intent),
  });

  const actionName = intent === "publish" ? "publish" : "save-draft";
  logBlogAction(actionName, {
    title: normalized.title,
    slug: normalized.slug || "(auto)",
    status,
    postId: normalized.id ?? "new",
  });

  try {
    validateBlogPostInput(normalized, intent);
    const post = await saveBlogPost(normalized, intent);

    logBlogAction(actionName, {
      title: post.title,
      slug: post.slug,
      status: post.status,
      postId: post.id,
      prisma: {
        id: post.id,
        slug: post.slug,
        status: post.status,
        publishedAt: post.publishedAt,
        updatedAt: post.updatedAt,
      },
    });

    if (status === "PUBLISHED") {
      revalidateBlogPaths(post.slug);
    } else {
      revalidateBlogPaths();
    }

    let hub: BlogPublishHubSummary | undefined;
    let hubWarning: string | undefined;

    if (intent === "publish") {
      try {
        const notify = await notifyMissionHubMembersOfBlogPublish(post, {
          publisherUserId: session.id,
        });
        hub = {
          announcementPostId: notify.announcement.postId,
          announcementSpaceSlug: notify.announcement.spaceSlug,
          announcementCreated: notify.announcementCreated,
          blogPublicPath: notify.announcement.blogPath,
          notificationsPrepared: notify.notifications.inAppDelivered,
          notify,
        };
      } catch (hubErr) {
        const reason = formatBlogError(hubErr);
        hubWarning = `Blog published, but Mission Hub notification failed: ${reason}`;
        console.error("[blog] Mission Hub publish failed", hubErr);
      }
    } else if (
      intent === "draft" &&
      (previousStatus === "PUBLISHED" || normalized.id)
    ) {
      const blogPostId = post.id ?? normalized.id;
      if (blogPostId && post.status !== "PUBLISHED") {
        await archiveMissionHubBlogAnnouncement(blogPostId).catch((err) => {
          console.error("[blog] archive hub announcement", err);
        });
      }
    }

    const message =
      intent === "publish" && hub
        ? formatBlogPublishSuccessMessage({
            blogSlug: post.slug,
            hub: {
              announcement: hub.notify.announcement,
              inAppNotificationsSent: hub.notify.notifications.inAppNotificationsSent,
              inAppNotificationsUpdated: hub.notify.notifications.inAppNotificationsUpdated,
              emailNotificationsSent: hub.notify.notifications.emailNotificationsSent,
              emailNotificationsDeduped: hub.notify.notifications.emailNotificationsDeduped,
              emailEnabled: hub.notify.notifications.emailEnabled,
            },
          })
        : successMessage(intent, hadExistingId, previousStatus);

    return {
      ok: true,
      post,
      message,
      hub,
      hubWarning,
    };
  } catch (e) {
    const error = formatBlogError(e);
    logBlogAction(actionName, {
      title: normalized.title,
      slug: normalized.slug,
      status,
      postId: normalized.id ?? "new",
    }, e);
    if (process.env.NODE_ENV === "development") {
      console.error(`[blog] ${actionName} error`, e);
    }
    return { ok: false, error };
  }
}

/** Load all blog posts (draft + published) for the admin list. */
export async function listAdminBlogPosts(): Promise<
  { ok: true; posts: BlogPostRecord[] } | { ok: false; error: string }
> {
  return listBlogPostsAction();
}

export async function listBlogPostsAction(): Promise<
  { ok: true; posts: BlogPostRecord[] } | { ok: false; error: string }
> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  try {
    const posts = await listBlogPostsForAdmin();
    logBlogAction("list-admin", { count: posts.length });
    return { ok: true, posts };
  } catch (e) {
    const error = formatBlogError(e);
    console.error("[blog] list-admin", e);
    return { ok: false, error };
  }
}

export async function getBlogPostAction(
  id: string,
): Promise<{ ok: true; post: BlogPostRecord } | { ok: false; error: string }> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  try {
    const post = await getBlogPostById(id);
    if (!post) return { ok: false, error: "Post not found" };
    return { ok: true, post };
  } catch (e) {
    return { ok: false, error: formatBlogError(e) };
  }
}

export async function createBlogPostDraftAction(
  input: Omit<BlogPostFormInput, "id">,
): Promise<SaveResult> {
  logBlogAction("create-draft", { title: input.title, slug: input.slug || "(auto)" });
  return persistBlogPost({ ...input, id: undefined }, "draft");
}

export async function updateBlogPostDraftAction(
  id: string,
  input: BlogPostFormInput,
): Promise<SaveResult> {
  logBlogAction("update-draft", { postId: id, title: input.title, slug: input.slug });
  return persistBlogPost({ ...input, id }, "draft");
}

export async function saveBlogPostDraftAction(input: BlogPostFormInput): Promise<SaveResult> {
  if (input.id?.trim()) {
    return updateBlogPostDraftAction(input.id.trim(), input);
  }
  const { id: _id, ...rest } = input;
  return createBlogPostDraftAction(rest);
}

export async function publishBlogPostAction(input: BlogPostFormInput): Promise<SaveResult> {
  return persistBlogPost(input, "publish");
}

export async function updateBlogPostAction(
  id: string,
  input: BlogPostFormInput,
  intent: "draft" | "publish",
): Promise<SaveResult> {
  return persistBlogPost({ ...input, id }, intent);
}

/** @deprecated Use saveBlogPostDraftAction / publishBlogPostAction */
export async function saveBlogPostAction(
  input: BlogPostFormInput,
  intent: "draft" | "publish",
): Promise<SaveResult> {
  return persistBlogPost(input, intent);
}

export async function deleteBlogPostAction(
  id: string,
): Promise<{ ok: true; message: string } | { ok: false; error: string }> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  try {
    const existing = await getBlogPostById(id);
    await deleteBlogPost(id);
    revalidateBlogPaths(existing?.slug);
    logBlogAction("delete", { postId: id, slug: existing?.slug });
    return { ok: true, message: "Blog post deleted." };
  } catch (e) {
    return { ok: false, error: formatBlogError(e) };
  }
}

export async function unpublishBlogPostAction(
  id: string,
): Promise<{ ok: true; post: BlogPostRecord; message: string } | { ok: false; error: string }> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  try {
    const existing = await getBlogPostById(id);
    if (!existing) return { ok: false, error: "Post not found" };
    const post = await saveBlogPost(
      {
        id: existing.id,
        title: existing.title,
        slug: existing.slug,
        excerpt: existing.excerpt,
        body: existing.body,
        featuredImageUrl: existing.featuredImageUrl,
        featuredImageAlt: existing.featuredImageAlt,
        status: "DRAFT",
        publishedAt: null,
      },
      "draft",
    );
    revalidateBlogPaths(existing.slug);
    if (existing.status === "PUBLISHED") {
      await archiveMissionHubBlogAnnouncement(existing.id).catch((err) => {
        console.error("[blog] archive hub announcement on unpublish", err);
      });
    }
    logBlogAction("unpublish", { postId: post.id, slug: post.slug });
    return { ok: true, post, message: "Post unpublished (draft)." };
  } catch (e) {
    return { ok: false, error: formatBlogError(e) };
  }
}

export async function getBlogMissionHubDiagnosticsAction(
  id: string,
): Promise<
  { ok: true; diagnostics: Awaited<ReturnType<typeof getBlogMissionHubDiagnostics>> } | { ok: false; error: string }
> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  try {
    const diagnostics = await getBlogMissionHubDiagnostics(id);
    return { ok: true, diagnostics };
  } catch (e) {
    return { ok: false, error: formatBlogError(e) };
  }
}

export async function republishBlogToMissionHubAction(
  id: string,
  options?: { resendBlogEmail?: boolean },
): Promise<SaveResult> {
  const session = await requireAdminSession();
  if (!session) return { ok: false, error: "Unauthorized" };
  try {
    const existing = await getBlogPostById(id);
    if (!existing) return { ok: false, error: "Post not found" };
    if (existing.status !== "PUBLISHED") {
      return { ok: false, error: "Blog post must be published before Mission Hub delivery." };
    }

    const notify = await notifyMissionHubMembersOfBlogPublish(existing, {
      publisherUserId: session.id,
      resendBlogEmail: options?.resendBlogEmail === true,
    });

    revalidateBlogPaths(existing.slug);
    revalidatePath("/community", "page");

    const message = formatBlogPublishSuccessMessage({
      blogSlug: existing.slug,
      hub: {
        announcement: notify.announcement,
        inAppNotificationsSent: notify.notifications.inAppNotificationsSent,
        inAppNotificationsUpdated: notify.notifications.inAppNotificationsUpdated,
        emailNotificationsSent: notify.notifications.emailNotificationsSent,
        emailNotificationsDeduped: notify.notifications.emailNotificationsDeduped,
        emailEnabled: notify.notifications.emailEnabled,
      },
    });

    return {
      ok: true,
      post: existing,
      message,
      hub: {
        announcementPostId: notify.announcement.postId,
        announcementSpaceSlug: notify.announcement.spaceSlug,
        announcementCreated: notify.announcementCreated,
        blogPublicPath: notify.announcement.blogPath,
        notificationsPrepared: notify.notifications.inAppDelivered,
        notify,
      },
    };
  } catch (e) {
    return { ok: false, error: formatBlogError(e) };
  }
}

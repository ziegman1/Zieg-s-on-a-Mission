"use server";

import {
  deleteBlogPost,
  getBlogPostById,
  listBlogPostsForAdmin,
  saveBlogPost,
  validateBlogPostInput,
} from "@/lib/blog/blog-db";
import { formatBlogError, logBlogAction } from "@/lib/blog/errors";
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

type SaveResult =
  | { ok: true; post: BlogPostRecord; message: string }
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

    return {
      ok: true,
      post,
      message: successMessage(intent, hadExistingId, previousStatus),
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
    logBlogAction("unpublish", { postId: post.id, slug: post.slug });
    return { ok: true, post, message: "Post unpublished (draft)." };
  } catch (e) {
    return { ok: false, error: formatBlogError(e) };
  }
}

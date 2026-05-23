import { unstable_noStore as noStore } from "next/cache";
import type { BlogPostStatus as PrismaBlogPostStatus } from "@prisma/client";
import { slugifyTitle, ensureUniqueBlogSlug } from "./slug";
import { getBlogPostDelegate, runBlogQuery, withBlogPostDelegate } from "./prisma-blog";
import type { BlogPostInput, BlogPostRecord, BlogPostStatus } from "./types";

function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL?.trim()) {
    throw new Error(
      "DATABASE_URL is not configured. Blog posts cannot be saved without a database connection.",
    );
  }
}

function toRecord(row: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  featuredImageUrl: string | null;
  featuredImageAlt: string;
  status: PrismaBlogPostStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): BlogPostRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body: row.body,
    featuredImageUrl: row.featuredImageUrl,
    featuredImageAlt: row.featuredImageAlt,
    status: row.status,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  return runBlogQuery(async (blog) => {
    const row = await blog.findUnique({ where: { slug }, select: { id: true } });
    if (!row) return false;
    if (excludeId && row.id === excludeId) return false;
    return true;
  });
}

function resolvePublishedAt(
  status: BlogPostStatus,
  publishedAtIso: string | null,
): Date | null {
  if (status !== "PUBLISHED") return null;
  if (publishedAtIso?.trim()) {
    const d = new Date(publishedAtIso);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

export function validateBlogPostInput(
  input: BlogPostInput,
  intent: "draft" | "publish",
): void {
  if (!input.title.trim()) {
    throw new Error("Title is required.");
  }
  if (intent === "publish" && !input.body.trim()) {
    throw new Error("Body is required before publishing.");
  }
}

export async function listBlogPostsForAdmin(): Promise<BlogPostRecord[]> {
  noStore();
  requireDatabaseUrl();
  const rows = await runBlogQuery((blog) =>
    blog.findMany({
      orderBy: [{ updatedAt: "desc" }],
    }),
  );
  return rows.map(toRecord);
}

export async function listPublishedBlogPosts(): Promise<BlogPostRecord[]> {
  noStore();
  if (!process.env.DATABASE_URL?.trim()) return [];
  return withBlogPostDelegate([], async (blog) => {
    const rows = await blog.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
    return rows.map(toRecord);
  });
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostRecord | null> {
  noStore();
  if (!process.env.DATABASE_URL?.trim()) return null;
  return withBlogPostDelegate(null, async (blog) => {
    const row = await blog.findFirst({
      where: { slug, status: "PUBLISHED" },
    });
    return row ? toRecord(row) : null;
  });
}

export async function getBlogPostById(id: string): Promise<BlogPostRecord | null> {
  noStore();
  requireDatabaseUrl();
  return runBlogQuery(async (blog) => {
    const row = await blog.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  });
}

export async function saveBlogPost(
  input: BlogPostInput,
  intent: "draft" | "publish" = input.status === "PUBLISHED" ? "publish" : "draft",
): Promise<BlogPostRecord> {
  requireDatabaseUrl();
  validateBlogPostInput(input, intent);

  const title = input.title.trim();
  const slugBase = slugifyTitle(input.slug.trim() || title);
  const slug = await ensureUniqueBlogSlug(slugBase, slugExists, input.id);

  const status = input.status;
  const publishedAt = resolvePublishedAt(status, input.publishedAt);

  const data = {
    title,
    slug,
    excerpt: input.excerpt.trim(),
    body: input.body,
    featuredImageUrl: input.featuredImageUrl?.trim() || null,
    featuredImageAlt: input.featuredImageAlt.trim(),
    status,
    publishedAt,
  };

  let row;
  if (input.id) {
    row = await runBlogQuery((blog) =>
      blog.update({
        where: { id: input.id },
        data,
      }),
    );
  } else {
    row = await runBlogQuery((blog) => blog.create({ data }));
  }

  const record = toRecord(row);

  const verify = await getBlogPostById(record.id);
  if (!verify) {
    throw new Error(
      `Blog post write did not persist (id ${record.id}). Check database connection and migrations.`,
    );
  }

  return record;
}

export async function deleteBlogPost(id: string): Promise<void> {
  requireDatabaseUrl();
  await runBlogQuery((blog) => blog.delete({ where: { id } }));
}

export async function getPublishedBlogSlugs(): Promise<string[]> {
  noStore();
  if (!process.env.DATABASE_URL?.trim()) return [];
  return withBlogPostDelegate([], async (blog) => {
    const rows = await blog.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    return rows.map((r) => r.slug);
  });
}

export function assertBlogPostReady(): void {
  requireDatabaseUrl();
  if (!getBlogPostDelegate()) {
    throw new Error(
      "Blog Prisma client is not ready. Run npx prisma generate and restart the dev server.",
    );
  }
}

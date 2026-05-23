import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatBlogError } from "./errors";

export type BlogPostDelegate = PrismaClient["blogPost"];

const BLOG_SETUP_HINT =
  "Run `npx prisma generate`, apply migrations (`npm run db:migrate:deploy`), then restart the dev server.";

/** Prisma delegate for BlogPost, or null if the client was generated before the model existed. */
export function getBlogPostDelegate(): BlogPostDelegate | null {
  const delegate = (prisma as PrismaClient & { blogPost?: BlogPostDelegate }).blogPost;
  if (!delegate || typeof delegate.findMany !== "function") {
    console.error(`[blog] prisma.blogPost is unavailable. ${BLOG_SETUP_HINT}`);
    return null;
  }
  return delegate;
}

export function isBlogPostsTableMissing(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('relation "blog_posts" does not exist') ||
      (msg.includes("blog_posts") && msg.includes("does not exist"))
    );
  }
  return false;
}

/** Admin / write paths — surfaces real errors instead of empty fallbacks. */
export async function runBlogQuery<T>(run: (blog: BlogPostDelegate) => Promise<T>): Promise<T> {
  const blog = getBlogPostDelegate();
  if (!blog) {
    throw new Error(`Blog Prisma client is not ready. ${BLOG_SETUP_HINT}`);
  }
  try {
    return await run(blog);
  } catch (error) {
    if (isBlogPostsTableMissing(error)) {
      throw new Error(`Blog table is missing. ${BLOG_SETUP_HINT}`);
    }
    throw error;
  }
}

/** Public read paths — never crash the storefront. */
export async function withBlogPostDelegate<T>(
  fallback: T,
  run: (blog: BlogPostDelegate) => Promise<T>,
): Promise<T> {
  const blog = getBlogPostDelegate();
  if (!blog) return fallback;
  try {
    return await run(blog);
  } catch (error) {
    if (isBlogPostsTableMissing(error)) {
      console.error(`[blog] blog_posts table is missing. ${BLOG_SETUP_HINT}`);
      return fallback;
    }
    console.error("[blog] public query failed:", formatBlogError(error));
    return fallback;
  }
}

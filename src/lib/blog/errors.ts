import { Prisma } from "@prisma/client";

const BLOG_SETUP_HINT =
  "Run `npx prisma generate`, apply migrations (`npm run db:migrate:deploy`), then restart the dev server.";

export function formatBlogError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2021" || error.code === "P2022") {
      return `Blog table is missing. ${BLOG_SETUP_HINT}`;
    }
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta.target as string[]).join(", ")
        : "field";
      return `A blog post with that ${target} already exists. Change the slug and try again.`;
    }
    return `Database error (${error.code}): ${error.message}`;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    if (error.message.includes("blogPost") || error.message.includes("blog_posts")) {
      return `Blog Prisma client is out of date. ${BLOG_SETUP_HINT}`;
    }
    return `Database connection failed. Check DATABASE_URL and restart the dev server. (${error.message})`;
  }

  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("blog_posts") || msg.includes("BlogPost") || msg.includes("prisma.blogPost")) {
      return `Blog database is not ready. ${BLOG_SETUP_HINT}`;
    }
    return msg;
  }

  return "Could not complete the blog operation.";
}

export function logBlogAction(
  action: string,
  details: Record<string, unknown>,
  error?: unknown,
): void {
  if (process.env.NODE_ENV === "production") return;
  if (error) {
    console.error(`[blog] ${action} failed`, details, error);
    return;
  }
  console.info(`[blog] ${action}`, details);
}

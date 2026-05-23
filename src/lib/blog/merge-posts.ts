import type { BlogPostRecord } from "./types";

/** Merge server list with a post we just saved (never drop the saved row on empty list). */
export function mergeAdminBlogPosts(
  serverPosts: BlogPostRecord[],
  saved: BlogPostRecord,
): BlogPostRecord[] {
  const byId = new Map<string, BlogPostRecord>();
  for (const p of serverPosts) byId.set(p.id, p);
  byId.set(saved.id, saved);
  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

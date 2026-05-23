import type { NewsletterRecord } from "./types";

/** Merge server list with a newsletter we just saved (never drop the saved row on empty list). */
export function mergeAdminNewsletters(
  serverItems: NewsletterRecord[],
  saved: NewsletterRecord,
): NewsletterRecord[] {
  const byId = new Map<string, NewsletterRecord>();
  for (const n of serverItems) byId.set(n.id, n);
  byId.set(saved.id, saved);
  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

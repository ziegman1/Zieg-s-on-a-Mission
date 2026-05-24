export type MissionHubNewsletterArchiveItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  issueDate: string | null;
  issueDateLabel: string | null;
  publishedAt: string | null;
  publishedAtLabel: string | null;
  newsletterPath: string;
};

function sortKey(item: MissionHubNewsletterArchiveItem): number {
  for (const iso of [item.publishedAt, item.issueDate]) {
    if (iso) {
      const t = new Date(iso).getTime();
      if (!Number.isNaN(t)) return t;
    }
  }
  return 0;
}

/** Sort archive items newest-first (publishedAt, then issueDate). */
export function sortNewsletterArchiveItems(
  items: MissionHubNewsletterArchiveItem[],
): MissionHubNewsletterArchiveItem[] {
  return [...items].sort((a, b) => sortKey(b) - sortKey(a));
}

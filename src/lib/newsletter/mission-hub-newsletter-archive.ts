import "server-only";

import { formatNewsletterIssueDateLabel, newsletterPublicPath } from "@/lib/newsletter/mission-hub-announcement";
import type { MissionHubNewsletterArchiveItem } from "@/lib/newsletter/mission-hub-newsletter-archive-types";
import { listPublishedNewsletters } from "@/lib/newsletter/newsletter-db";
import type { NewsletterRecord } from "@/lib/newsletter/types";

export type { MissionHubNewsletterArchiveItem } from "@/lib/newsletter/mission-hub-newsletter-archive-types";
export { sortNewsletterArchiveItems } from "@/lib/newsletter/mission-hub-newsletter-archive-types";

function toArchiveItem(newsletter: NewsletterRecord): MissionHubNewsletterArchiveItem {
  const issueDateLabel = formatNewsletterIssueDateLabel(newsletter.issueDate);
  const publishedAtLabel = newsletter.publishedAt
    ? formatNewsletterIssueDateLabel(newsletter.publishedAt)
    : null;

  return {
    id: newsletter.id,
    slug: newsletter.slug,
    title: newsletter.title.trim() || "Newsletter",
    excerpt:
      newsletter.excerpt.trim() ||
      newsletter.subtitle.trim() ||
      "",
    issueDate: newsletter.issueDate,
    issueDateLabel,
    publishedAt: newsletter.publishedAt,
    publishedAtLabel,
    newsletterPath: newsletterPublicPath(newsletter.slug),
  };
}

/** Published newsletters for the Mission Hub Newsletters space archive (newest first). */
export async function listMissionHubNewsletterArchive(): Promise<
  MissionHubNewsletterArchiveItem[]
> {
  const newsletters = await listPublishedNewsletters();
  return newsletters.map(toArchiveItem);
}

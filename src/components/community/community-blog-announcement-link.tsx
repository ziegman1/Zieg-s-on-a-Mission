import Link from "next/link";
import { formatBlogPublishedDateLabel } from "@/lib/blog/mission-hub-announcement";
import type { BlogAnnouncementFeedLink } from "@/lib/community/types";

export function CommunityBlogAnnouncementLink({
  announcement,
}: {
  announcement: BlogAnnouncementFeedLink;
}) {
  const dateLabel = formatBlogPublishedDateLabel(announcement.publishedAt);

  return (
    <div className="rounded-xl bg-brand-primary/[0.06] ring-1 ring-brand-primary/12 px-3.5 py-3 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary/70">
        {dateLabel ? `Blog article · ${dateLabel}` : "Blog article"}
      </p>
      <p>
        <Link
          href={announcement.blogPath}
          className="text-sm font-semibold text-brand-primary hover:underline"
        >
          Read the full article →
        </Link>
      </p>
    </div>
  );
}

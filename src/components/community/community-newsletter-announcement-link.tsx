import Link from "next/link";
import type { NewsletterAnnouncementFeedLink } from "@/lib/community/types";
import { formatNewsletterIssueDateLabel } from "@/lib/newsletter/mission-hub-announcement";

export function CommunityNewsletterAnnouncementLink({
  announcement,
}: {
  announcement: NewsletterAnnouncementFeedLink;
}) {
  const issueLabel = formatNewsletterIssueDateLabel(announcement.issueDate);
  const ctaLabel = announcement.ctaLabel?.trim();
  const ctaUrl = announcement.ctaUrl?.trim();

  return (
    <div className="rounded-xl bg-brand-primary/[0.06] ring-1 ring-brand-primary/12 px-3.5 py-3 space-y-2">
      {issueLabel ? (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary/70">
          Newsletter · {issueLabel}
        </p>
      ) : (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-primary/70">
          Newsletter
        </p>
      )}
      <p>
        <Link
          href={announcement.newsletterPath}
          className="text-sm font-semibold text-brand-primary hover:underline"
        >
          Read the full newsletter →
        </Link>
      </p>
      {ctaLabel && ctaUrl ? (
        <p className="text-sm text-brand-ink/75">
          <a
            href={ctaUrl}
            className="font-medium text-brand-primary hover:underline"
            target={ctaUrl.startsWith("http") ? "_blank" : undefined}
            rel={ctaUrl.startsWith("http") ? "noopener noreferrer" : undefined}
          >
            {ctaLabel}
          </a>
        </p>
      ) : null}
    </div>
  );
}

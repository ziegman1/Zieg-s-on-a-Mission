import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { MissionHubNewsletterArchiveItem } from "@/lib/newsletter/mission-hub-newsletter-archive-types";
import { cn } from "@/lib/utils";

/**
 * Newsletters space archive row — title only (no social post chrome).
 */
export function NewsletterArchiveCard({
  item,
  className,
}: {
  item: MissionHubNewsletterArchiveItem;
  className?: string;
}) {
  const dateLabel = item.issueDateLabel ?? item.publishedAtLabel;

  return (
    <Link
      href={item.newsletterPath}
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-black/[0.06] bg-white px-3 py-2.5 sm:py-3",
        "shadow-[0_1px_2px_rgba(0,0,0,0.03)]",
        "hover:border-brand-primary/20 hover:bg-brand-surface/30",
        "active:scale-[0.99] transition-[transform,background-color,border-color] duration-150 touch-manipulation",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {dateLabel ? (
          <p className="text-[10px] text-brand-ink/45 leading-none mb-1">{dateLabel}</p>
        ) : null}
        <p className="font-medium text-sm sm:text-[15px] text-brand-ink leading-snug line-clamp-2 group-hover:text-brand-primary transition-colors">
          {item.title}
        </p>
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-brand-ink/30 group-hover:text-brand-primary/70 transition-colors"
        aria-hidden
      />
    </Link>
  );
}

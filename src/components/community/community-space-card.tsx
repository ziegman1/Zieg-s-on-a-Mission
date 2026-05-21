import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CommunitySpace } from "@/lib/community/types";
import { cn } from "@/lib/utils";
import { CommunitySpaceIcon } from "./community-space-icon";
import { CommunitySpaceStatusBadge } from "./community-space-status-badge";

function spaceHref(space: CommunitySpace): string | null {
  if (space.status === "published" && space.slug) {
    return `/community/${space.slug}`;
  }
  return null;
}

export function CommunitySpaceCard({
  space,
  className,
  compact = false,
}: {
  space: CommunitySpace;
  className?: string;
  /** Sidebar list style */
  compact?: boolean;
}) {
  const href = spaceHref(space);
  const isLink = Boolean(href);

  const card = (
    <Card
      className={cn(
        "border-brand-primary/20 bg-white/70 shadow-sm transition-shadow",
        !isLink && "opacity-90",
        isLink && "hover:border-brand-primary/40 hover:shadow-md",
        compact ? "py-0 gap-0" : "",
        className,
      )}
    >
      <CardHeader className={cn(compact ? "px-4 py-3 gap-2" : "pb-2")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-lg bg-brand-primary/15 text-brand-primary",
                compact ? "h-9 w-9" : "h-11 w-11",
              )}
            >
              <CommunitySpaceIcon icon={space.icon} />
            </span>
            <div className="min-w-0">
              <CardTitle
                className={cn(
                  "font-serif text-brand-ink tracking-wide",
                  compact ? "text-base" : "text-lg",
                  isLink && "group-hover:text-brand-primary transition-colors",
                )}
              >
                {space.title}
              </CardTitle>
              {!compact ? (
                <p className="mt-1 text-sm text-brand-ink/70 leading-relaxed line-clamp-2">
                  {space.description}
                </p>
              ) : null}
            </div>
          </div>
          <CommunitySpaceStatusBadge status={space.status} />
        </div>
      </CardHeader>
      {!compact ? (
        <CardContent className="pt-0">
          <p className="text-xs text-brand-ink/55">
            {space.postCount === 0 ? "No posts yet" : `${space.postCount} post${space.postCount === 1 ? "" : "s"}`}
          </p>
        </CardContent>
      ) : (
        <CardContent className="px-4 pb-3 pt-0">
          <p className="text-xs text-brand-ink/55">
            {space.postCount === 0 ? "—" : space.postCount}
          </p>
        </CardContent>
      )}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50">
        {card}
      </Link>
    );
  }

  return card;
}

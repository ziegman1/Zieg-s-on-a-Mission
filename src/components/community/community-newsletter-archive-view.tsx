"use client";

import { useMemo, useState } from "react";
import type { CommunitySpaceDetail } from "@/lib/community/space-experience";
import {
  sortNewsletterArchiveItems,
  type MissionHubNewsletterArchiveItem,
} from "@/lib/newsletter/mission-hub-newsletter-archive-types";
import { CommunityFeedEmpty } from "./community-feed-empty";
import { CommunitySpacePageHeader } from "./community-space-page-header";
import { NewsletterArchiveCard } from "./newsletter-archive-card";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 20;

export function CommunityNewsletterArchiveView({
  space,
  items,
}: {
  space: CommunitySpaceDetail;
  items: MissionHubNewsletterArchiveItem[];
}) {
  const sorted = useMemo(() => sortNewsletterArchiveItems(items), [items]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  return (
    <div className="space-y-2.5">
      <CommunitySpacePageHeader
        title={space.title}
        subtitle={
          space.description?.trim() ||
          "Published issues — tap to read."
        }
      />
      {sorted.length > 0 ? (
        <>
          <ul className="space-y-1.5 list-none p-0 m-0" aria-label="Newsletter archive">
            {visible.map((item) => (
              <li key={item.id}>
                <NewsletterArchiveCard item={item} />
              </li>
            ))}
          </ul>
          {hasMore ? (
            <div className="flex justify-center pt-1 pb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-brand-primary/30 text-brand-primary"
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              >
                Show more ({sorted.length - visible.length} remaining)
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <CommunityFeedEmpty
          variant="space"
          title="No newsletters yet"
          body="When a newsletter is published, it will appear here as a new issue."
        />
      )}
    </div>
  );
}

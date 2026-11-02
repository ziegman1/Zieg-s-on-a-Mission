"use client";

import type { PageSection } from "@/lib/site-builder/types";
import type { PublicProgressCounts } from "@/lib/ministry/ministry-milestones";
import { PageSectionsRenderer } from "@/components/site-builder/page-sections-renderer";
import { defaultOurMissionEditableSections } from "@/lib/site-builder/our-mission-page-sections";

/**
 * Public / preview Our Mission page.
 * Content comes from Site Builder sections; tracker totals stay data-bound.
 */
export function OurMissionPage({
  counts,
  sections,
  siteTagline = "",
}: {
  counts: PublicProgressCounts | null;
  sections?: PageSection[];
  siteTagline?: string;
}) {
  const resolved = sections?.length ? sections : defaultOurMissionEditableSections();
  return (
    <PageSectionsRenderer
      pageKey="our-mission"
      sections={resolved}
      siteTagline={siteTagline}
      progressCounts={counts}
    />
  );
}

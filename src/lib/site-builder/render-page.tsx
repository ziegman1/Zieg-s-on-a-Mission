import { unstable_noStore as noStore } from "next/cache";
import { ReactNode } from "react";
import { PageSectionsRenderer } from "@/components/site-builder/page-sections-renderer";
import { getSiteCopy } from "@/lib/site-copy";
import { getMinistryOutcomeCounts } from "@/lib/ministry/ministry-db";
import {
  publicProgressCounts,
  type PublicProgressCounts,
} from "@/lib/ministry/ministry-milestones";
import { getPublishedPageSections, pageHasCustomSections } from "./sections-db";

/**
 * Aggregate integers for the homepage ministry progress tracker.
 *
 * Only the home page needs them. A failure leaves the tracker out of the page rather than
 * showing zeros that were never counted.
 */
async function loadPublicProgressCounts(pageKey: string): Promise<PublicProgressCounts | null> {
  if (pageKey !== "home") return null;
  try {
    return publicProgressCounts(await getMinistryOutcomeCounts());
  } catch (error) {
    console.error("[render-page] ministry progress counts unavailable", error);
    return null;
  }
}

export async function renderStorefrontPage(
  pageKey: string,
  legacy: () => ReactNode,
): Promise<ReactNode> {
  noStore();
  const hasCustom = await pageHasCustomSections(pageKey);
  if (!hasCustom) {
    return legacy();
  }
  const [sections, copy, progressCounts] = await Promise.all([
    getPublishedPageSections(pageKey),
    getSiteCopy(),
    loadPublicProgressCounts(pageKey),
  ]);
  return (
    <PageSectionsRenderer
      pageKey={pageKey}
      sections={sections}
      siteTagline={copy.site.tagline}
      progressCounts={progressCounts}
    />
  );
}

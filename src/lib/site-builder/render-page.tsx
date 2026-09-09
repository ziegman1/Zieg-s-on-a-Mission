import { unstable_noStore as noStore } from "next/cache";
import { ReactNode } from "react";
import { PageSectionsRenderer } from "@/components/site-builder/page-sections-renderer";
import { getSiteCopy } from "@/lib/site-copy";
import type { RecruitCounts } from "@/lib/recruits/recruit-milestones";
import { getRecruitCounts } from "@/lib/recruits/recruits-db";
import { getPublishedPageSections, pageHasCustomSections } from "./sections-db";

/**
 * Aggregate integers for the homepage ministry progress tracker.
 *
 * Only the home page needs them, and a failure here must never take the page down — the tracker
 * simply falls back to its zero state.
 */
async function loadRecruitCounts(pageKey: string): Promise<RecruitCounts | null> {
  if (pageKey !== "home") return null;
  try {
    return await getRecruitCounts();
  } catch (error) {
    console.error("[render-page] recruit counts unavailable", error);
    return { mobilized: 0, trained: 0, sent: 0 };
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
  const [sections, copy, recruitCounts] = await Promise.all([
    getPublishedPageSections(pageKey),
    getSiteCopy(),
    loadRecruitCounts(pageKey),
  ]);
  return (
    <PageSectionsRenderer
      pageKey={pageKey}
      sections={sections}
      siteTagline={copy.site.tagline}
      recruitCounts={recruitCounts}
    />
  );
}

"use client";

import type { PageSection } from "@/lib/site-builder/types";
import { PageSectionsRenderer } from "@/components/site-builder/page-sections-renderer";
import { defaultMinistryFundingSections } from "@/lib/site-builder/ministry-funding-page-sections";

/**
 * Public / preview Ministry Funding & Partnership page.
 * Content comes from Site Builder sections; finance math stays derived in code.
 */
export function MinistryFundingPage({
  sections,
  siteTagline = "",
}: {
  sections?: PageSection[];
  siteTagline?: string;
}) {
  const resolved = sections?.length ? sections : defaultMinistryFundingSections();
  return (
    <PageSectionsRenderer
      pageKey="ministry-funding"
      sections={resolved}
      siteTagline={siteTagline}
    />
  );
}

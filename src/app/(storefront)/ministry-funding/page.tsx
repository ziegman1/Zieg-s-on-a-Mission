export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { MinistryFundingPage } from "@/components/ministry-funding/ministry-funding-page";
import { MINISTRY_FUNDING_META } from "@/data/ministry-funding-content";
import { getPublishedPageSections } from "@/lib/site-builder/sections-db";
import { getSiteCopy } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: MINISTRY_FUNDING_META.title,
  description: MINISTRY_FUNDING_META.description,
};

export default async function Page() {
  const [sections, copy] = await Promise.all([
    getPublishedPageSections("ministry-funding"),
    getSiteCopy(),
  ]);

  return (
    <MinistryFundingPage sections={sections} siteTagline={copy.site.tagline} />
  );
}

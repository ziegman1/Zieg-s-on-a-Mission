export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { OurMissionPage } from "@/components/mission/our-mission-page";
import { OUR_MISSION_META } from "@/data/our-mission-content";
import { loadPublicMinistryProgressCounts } from "@/lib/ministry/ministry-db";
import { getPublishedPageSections } from "@/lib/site-builder/sections-db";
import { getSiteCopy } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: OUR_MISSION_META.title,
  description: OUR_MISSION_META.description,
};

export default async function Page() {
  const [counts, sections, copy] = await Promise.all([
    loadPublicMinistryProgressCounts(),
    getPublishedPageSections("our-mission"),
    getSiteCopy(),
  ]);

  return (
    <OurMissionPage
      counts={counts}
      sections={sections}
      siteTagline={copy.site.tagline}
    />
  );
}

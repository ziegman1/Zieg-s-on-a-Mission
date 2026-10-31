export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { OurMissionPage } from "@/components/mission/our-mission-page";
import { OUR_MISSION_META } from "@/data/our-mission-content";
import { loadPublicMinistryProgressCounts } from "@/lib/ministry/ministry-db";
import { getPublishedPageSections, pageHasCustomSections } from "@/lib/site-builder/sections-db";
import { getSiteCopy } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: OUR_MISSION_META.title,
  description: OUR_MISSION_META.description,
};

export default async function Page() {
  const hasEditorial = await pageHasCustomSections("our-mission");
  const [counts, editorialSections, copy] = await Promise.all([
    loadPublicMinistryProgressCounts(),
    hasEditorial ? getPublishedPageSections("our-mission") : Promise.resolve([]),
    hasEditorial ? getSiteCopy() : Promise.resolve(null),
  ]);

  return (
    <OurMissionPage
      counts={counts}
      editorialSections={editorialSections}
      siteTagline={copy?.site.tagline ?? ""}
    />
  );
}

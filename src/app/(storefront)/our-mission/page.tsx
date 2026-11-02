export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { OurMissionPage } from "@/components/mission/our-mission-page";
import { OUR_MISSION_META } from "@/data/our-mission-content";
import { loadPublicMinistryProgressCounts } from "@/lib/ministry/ministry-db";
import {
  partitionOurMissionEditorialSections,
  resolveOurMissionNarrative,
} from "@/lib/site-builder/our-mission-page-sections";
import { getPublishedPageSections, pageHasCustomSections } from "@/lib/site-builder/sections-db";
import { getSiteCopy } from "@/lib/site-copy";

export const metadata: Metadata = {
  title: OUR_MISSION_META.title,
  description: OUR_MISSION_META.description,
};

export default async function Page() {
  const hasCustom = await pageHasCustomSections("our-mission");
  const [counts, customSections, copy] = await Promise.all([
    loadPublicMinistryProgressCounts(),
    hasCustom ? getPublishedPageSections("our-mission") : Promise.resolve([]),
    hasCustom ? getSiteCopy() : Promise.resolve(null),
  ]);

  const narrative = resolveOurMissionNarrative(customSections);
  const editorialSections = partitionOurMissionEditorialSections(customSections);

  return (
    <OurMissionPage
      counts={counts}
      narrative={narrative}
      editorialSections={editorialSections}
      siteTagline={copy?.site.tagline ?? ""}
    />
  );
}

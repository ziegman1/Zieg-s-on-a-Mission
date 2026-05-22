import type { Metadata } from "next";
import { CommunityAppShell } from "@/components/community/community-app-shell";
import { CommunitySpacesPageClient } from "@/components/community/community-spaces-page-client";
import { getCurrentCommunityOwner } from "@/lib/community/owner";
import { listPublishedCommunitySpaces } from "@/lib/community/spaces";
import { getSiteCopy } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const copy = await getSiteCopy();
  return {
    title: `Spaces | Mission Hub`,
    description: `Browse community spaces — ${copy.site.name}`,
  };
}

export default async function CommunitySpacesPage() {
  const owner = await getCurrentCommunityOwner();
  let publishedSpaces: Awaited<ReturnType<typeof listPublishedCommunitySpaces>> = [];
  try {
    publishedSpaces = await listPublishedCommunitySpaces();
  } catch (e) {
    console.error("[community/spaces]", e);
  }

  return (
    <CommunityAppShell publishedSpaces={publishedSpaces} activeSlug={null} owner={owner}>
      <CommunitySpacesPageClient spaces={publishedSpaces} />
    </CommunityAppShell>
  );
}

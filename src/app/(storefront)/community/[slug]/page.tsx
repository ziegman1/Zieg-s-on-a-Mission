import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CommunityAppShell } from "@/components/community/community-app-shell";
import { CommunitySpiritualSpaceView } from "@/components/community/community-spiritual-space-view";
import { CommunitySpaceFeed } from "@/components/community/community-space-feed";
import {
  devLogMissionHubSpacePreset,
  getSpaceInteractionPreset,
  resolveInteractionSpaceType,
} from "@/lib/community/space-interaction";
import { isSpiritualRoom } from "@/lib/community/spiritual-room";
import { listComposerSpacesForOwner } from "@/lib/community/composer-spaces";
import { getCurrentCommunityOwner } from "@/lib/community/owner";
import { CommunityNewsletterArchive } from "@/components/community/community-newsletter-archive";
import { listPublishedPostsBySpaceSlug } from "@/lib/community/posts";
import { NEWSLETTER_SPACE_SLUG } from "@/lib/newsletter/mission-hub-announcement";
import { listMissionHubNewsletterArchive } from "@/lib/newsletter/mission-hub-newsletter-archive";
import {
  getPublishedCommunitySpaceDetailBySlug,
  listPublishedCommunitySpaces,
} from "@/lib/community/spaces";
import { getVisitorKey } from "@/lib/community/visitor-key";
import { getSiteCopy } from "@/lib/site-copy";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [space, copy] = await Promise.all([
    getPublishedCommunitySpaceDetailBySlug(slug),
    getSiteCopy(),
  ]);

  if (!space) {
    return { title: `Space not found | ${copy.site.name}` };
  }

  const description =
    space.description.trim() ||
    space.experience.welcomeMessage?.split(/\n\n/)[0]?.trim() ||
    `Posts in ${space.title}`;

  return {
    title: `${space.title} | Mission Hub`,
    description: description.slice(0, 300),
  };
}

export default async function CommunitySpacePage({ params }: PageProps) {
  const { slug } = await params;
  const space = await getPublishedCommunitySpaceDetailBySlug(slug);
  if (!space) notFound();

  const [owner, visitorKey] = await Promise.all([
    getCurrentCommunityOwner(),
    getVisitorKey(),
  ]);

  const isNewsletterArchiveSpace =
    slug.trim().toLowerCase() === NEWSLETTER_SPACE_SLUG;

  let publishedSpaces: Awaited<ReturnType<typeof listPublishedCommunitySpaces>> = [];
  let posts: Awaited<ReturnType<typeof listPublishedPostsBySpaceSlug>> = [];
  let newsletterArchive: Awaited<ReturnType<typeof listMissionHubNewsletterArchive>> = [];
  let composerSpaces: Awaited<ReturnType<typeof listComposerSpacesForOwner>> = [];
  try {
    if (isNewsletterArchiveSpace) {
      [publishedSpaces, newsletterArchive] = await Promise.all([
        listPublishedCommunitySpaces(),
        listMissionHubNewsletterArchive(),
      ]);
    } else {
      [publishedSpaces, posts] = await Promise.all([
        listPublishedCommunitySpaces(),
        listPublishedPostsBySpaceSlug(slug, 50, visitorKey),
      ]);
    }
    if (owner) composerSpaces = await listComposerSpacesForOwner();
  } catch (e) {
    console.error("[community/[slug]] failed to load:", e);
  }

  const spiritual = isSpiritualRoom(space.experience.spaceType, space.slug);
  const resolvedType = resolveInteractionSpaceType(
    space.experience.spaceType,
    space.slug,
  );
  const preset = getSpaceInteractionPreset(space.experience.spaceType, space.slug);

  if (process.env.NODE_ENV === "development") {
    console.log("[MissionHub space page]", {
      slug: space.slug,
      title: space.title,
      dbSpaceType: space.experience.spaceType,
      resolvedType,
      preset: preset.mode,
      allowVoiceMessages: space.experience.allowVoiceMessages,
      spiritualLayout: spiritual,
    });
    devLogMissionHubSpacePreset({
      slug: space.slug,
      spaceType: space.experience.spaceType,
      resolvedType,
      presetName: preset.mode,
      source: "community/[slug]/page",
    });
  }

  return (
    <CommunityAppShell
      publishedSpaces={publishedSpaces}
      activeSlug={space.slug}
      owner={owner}
      composerSpaces={composerSpaces}
      defaultSpaceId={space.id}
      spaceDetail={spiritual ? space : null}
    >
      {isNewsletterArchiveSpace ? (
        <CommunityNewsletterArchive space={space} items={newsletterArchive} />
      ) : spiritual ? (
        <Suspense fallback={null}>
          <CommunitySpiritualSpaceView
            space={space}
            posts={posts}
            owner={owner}
            composerSpaces={composerSpaces}
          />
        </Suspense>
      ) : (
        <CommunitySpaceFeed
          space={space}
          posts={posts}
          owner={owner}
          composerSpaces={composerSpaces}
        />
      )}
    </CommunityAppShell>
  );
}

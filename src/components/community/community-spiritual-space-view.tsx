"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunitySpaceDetail } from "@/lib/community/space-experience";
import type { CommunityPostFeedItem } from "@/lib/community/types";
import { getSpaceInteractionPreset } from "@/lib/community/space-interaction";
import {
  buildPrayerRoomComposeCallbackUrl,
  parsePrayerRoomComposerKind,
  type PrayerRoomComposerKind,
} from "@/lib/community/prayer-room-composer";
import { canUseVoicePrayer } from "@/lib/community/voice-prayer";
import { CommunityPostFeed } from "./community-post-feed";
import { CommunitySpacePageHeader } from "./community-space-page-header";
import { CommunityPrayerRoomComposer } from "./community-prayer-room-composer";
import { CommunityPrayerRoomWelcomeActions } from "./community-prayer-room-welcome-actions";
import { CommunityPrayerToast } from "./community-prayer-toast";
import { CommunitySpiritualEmptyState } from "./community-spiritual-empty-state";
import { CommunitySpaceHero } from "./community-space-hero";
import { CommunitySpaceWelcomeIntro } from "./community-space-welcome-intro";

export function CommunitySpiritualSpaceView({
  space,
  posts,
  owner,
  composerSpaces,
}: {
  space: CommunitySpaceDetail;
  posts: CommunityPostFeedItem[];
  owner: CommunityOwner | null;
  composerSpaces: CommunityComposerSpace[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const feedRef = useRef<HTMLDivElement>(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerKind, setComposerKind] = useState<PrayerRoomComposerKind | null>(
    null,
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const preset = getSpaceInteractionPreset(space.experience.spaceType, space.slug);
  const prayerRoom = preset.mode === "prayer";
  const allowVoice = canUseVoicePrayer(space.experience);
  const openJoin = useCallback(() => {
    setComposerKind(null);
    setComposerOpen(true);
  }, []);

  const openComposer = useCallback((kind: PrayerRoomComposerKind) => {
    setComposerKind(kind);
    setComposerOpen(true);
  }, []);

  const handleComposerOpenChange = useCallback((next: boolean) => {
    setComposerOpen(next);
    if (!next) setComposerKind(null);
  }, []);

  const scrollToFeed = useCallback(() => {
    feedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const kind = parsePrayerRoomComposerKind(searchParams.get("compose"));
    if (!kind) return;
    if (kind === "voice_prayer" && !allowVoice) {
      openComposer("prayer_request");
    } else {
      openComposer(kind);
    }
    const next = new URLSearchParams(searchParams.toString());
    next.delete("compose");
    const q = next.toString();
    router.replace(q ? `/community/${space.slug}?${q}` : `/community/${space.slug}`, {
      scroll: false,
    });
  }, [searchParams, allowVoice, openComposer, router, space.slug]);

  function handleComposeClick(kind: PrayerRoomComposerKind) {
    if (kind === "voice_prayer" && !allowVoice) {
      openComposer("prayer_request");
      return;
    }
    openComposer(kind);
  }

  function handleShared(message: string) {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(null), 3200);
    scrollToFeed();
  }

  return (
    <>
      <div className="space-y-3 sm:space-y-5">
        <CommunitySpaceHero space={space} />
        <CommunitySpacePageHeader
          title={space.title}
          owner={owner}
          composerSpaces={composerSpaces}
          defaultSpaceId={space.id}
          defaultPostType={preset.mode === "prayer" ? "prayer" : undefined}
        />
        <CommunitySpaceWelcomeIntro space={space} />
        {prayerRoom ? (
          <CommunityPrayerRoomWelcomeActions
            posts={posts}
            onJoin={openJoin}
            onScrollToFeed={scrollToFeed}
          />
        ) : null}
        <div ref={feedRef} id="prayer-room-feed" className="scroll-mt-24">
          {posts.length > 0 ? (
            <CommunityPostFeed
              posts={posts}
              showSpaceLabel={false}
              variant="spiritual"
              owner={owner}
              composerSpaces={composerSpaces}
            />
          ) : (
            <CommunitySpiritualEmptyState
              showOwnerCta={prayerRoom}
              onShareRequest={prayerRoom ? openJoin : undefined}
              variant={prayerRoom ? "prayer" : "default"}
            />
          )}
        </div>
        {space.experience.engagementPrompt && posts.length > 0 ? (
          <p className="text-center text-[13px] text-brand-ink/38 italic font-light px-4 pb-1">
            {space.experience.engagementPrompt}
          </p>
        ) : null}
      </div>

      <CommunityPrayerRoomComposer
        open={composerOpen}
        onOpenChange={handleComposerOpenChange}
        kind={composerKind}
        onKindSelect={openComposer}
        spaceId={space.id}
        spaceSlug={space.slug}
        returnPath={
          composerKind
            ? buildPrayerRoomComposeCallbackUrl(space.slug, composerKind)
            : `/community/${space.slug}`
        }
        allowVoice={allowVoice}
        onShared={handleShared}
      />

      <CommunityPrayerToast message={toastMessage ?? ""} visible={Boolean(toastMessage)} />
    </>
  );
}

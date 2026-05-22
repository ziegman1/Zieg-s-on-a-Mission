"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createVisitorMemberProfileAction } from "@/app/(storefront)/community/member-actions";
import { allowVisitorOnlyComments } from "@/lib/community/members";
import type { CommentAuthorContext, CommunityMemberProfile } from "@/lib/community/members";
import {
  getPrayerRoomComposerPreset,
  type PrayerRoomComposerKind,
} from "@/lib/community/prayer-room-composer";
import { CommunityBottomSheet } from "./community-bottom-sheet";
import { CommunityJoinPrompt } from "./community-join-prompt";
import { CommunityMemberProfileForm } from "./community-member-profile-form";
import { CommunityPrayerRoomPostForm } from "./community-prayer-room-post-form";
import { useCommunityCommentAuthor } from "./use-community-comment-author";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function CommunityPrayerRoomComposer({
  open,
  onOpenChange,
  kind,
  spaceId,
  spaceSlug,
  returnPath,
  allowVoice,
  onShared,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: PrayerRoomComposerKind | null;
  spaceId: string;
  spaceSlug: string;
  returnPath: string;
  allowVoice: boolean;
  onShared: (message: string) => void;
}) {
  const router = useRouter();
  const preset = kind ? getPrayerRoomComposerPreset(kind) : null;
  const loadedAuthor = useCommunityCommentAuthor();
  const [authorContext, setAuthorContext] = useState<CommentAuthorContext | null>(null);
  const activeAuthor = authorContext ?? loadedAuthor;

  function handleVisitorProfileCreated(member: CommunityMemberProfile) {
    setAuthorContext({ kind: "visitor", member });
  }

  function handleSuccess(message: string) {
    onOpenChange(false);
    onShared(message);
    router.refresh();
  }

  const inner = !preset ? null : activeAuthor === null ? (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-brand-ink/50">
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      Loading…
    </div>
  ) : activeAuthor.kind === "guest" ? (
    allowVisitorOnlyComments() ? (
      <CommunityMemberProfileForm
        onCreated={handleVisitorProfileCreated}
        createAction={createVisitorMemberProfileAction}
      />
    ) : (
      <CommunityJoinPrompt
        returnPath={returnPath}
        message="Join Mission Hub to share in the Prayer & Praise Room."
      />
    )
  ) : (
    <CommunityPrayerRoomPostForm
      spaceId={spaceId}
      spaceSlug={spaceSlug}
      preset={preset}
      authorContext={activeAuthor}
      allowVoice={allowVoice}
      autoFocus
      onSuccess={handleSuccess}
    />
  );

  return (
    <>
      {/* Mobile: bottom sheet */}
      <div className="lg:hidden">
        <CommunityBottomSheet
          open={open && Boolean(preset)}
          onOpenChange={onOpenChange}
          title={preset?.sheetTitle ?? ""}
          description={preset?.sheetDescription}
          className="max-h-[min(88dvh,680px)]"
        >
          {inner}
        </CommunityBottomSheet>
      </div>

      {/* Desktop: centered modal */}
      <Dialog open={open && Boolean(preset)} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className={cn(
            "hidden lg:flex lg:flex-col gap-0 p-0 overflow-hidden",
            "sm:max-w-lg max-h-[min(85dvh,36rem)]",
          )}
        >
          <DialogTitle className="sr-only">{preset?.sheetTitle}</DialogTitle>
          <div className="px-5 pt-5 pb-2 border-b border-black/[0.06]">
            <h2 className="font-serif text-lg text-brand-ink tracking-wide">
              {preset?.sheetTitle}
            </h2>
            {preset?.sheetDescription ? (
              <p className="mt-1 text-sm text-brand-ink/55">{preset.sheetDescription}</p>
            ) : null}
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{inner}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}

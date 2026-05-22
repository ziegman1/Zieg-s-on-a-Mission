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
import { useVisualViewportKeyboardInset } from "@/hooks/use-visual-viewport-keyboard-inset";
import { CommunityBottomSheet } from "./community-bottom-sheet";
import { CommunityJoinPrompt } from "./community-join-prompt";
import { CommunityMemberProfileForm } from "./community-member-profile-form";
import { CommunityPrayerRoomParticipationPicker } from "./community-prayer-room-participation-picker";
import { CommunityPrayerRoomPostForm } from "./community-prayer-room-post-form";
import { useCommunityCommentAuthor } from "./use-community-comment-author";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const PICKER_TITLE = "Join in Prayer";
const PICKER_DESCRIPTION = "Share with the community in the way that fits this moment.";

export function CommunityPrayerRoomComposer({
  open,
  onOpenChange,
  kind,
  onKindSelect,
  spaceId,
  spaceSlug,
  returnPath,
  allowVoice,
  onShared,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: PrayerRoomComposerKind | null;
  onKindSelect: (kind: PrayerRoomComposerKind) => void;
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
  const keyboardInset = useVisualViewportKeyboardInset(open && Boolean(kind));
  const showingPicker = open && !kind;

  function handleVisitorProfileCreated(member: CommunityMemberProfile) {
    setAuthorContext({ kind: "visitor", member });
  }

  function handleSuccess(message: string) {
    onOpenChange(false);
    onShared(message);
    router.refresh();
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  const composeInner = !preset ? null : activeAuthor === null ? (
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

  const pickerInner = (
    <CommunityPrayerRoomParticipationPicker
      allowVoice={allowVoice}
      onSelect={onKindSelect}
    />
  );

  const sheetTitle = showingPicker ? PICKER_TITLE : (preset?.sheetTitle ?? "");
  const sheetDescription = showingPicker
    ? PICKER_DESCRIPTION
    : preset?.sheetDescription;

  return (
    <>
      <div className="lg:hidden">
        <CommunityBottomSheet
          open={open}
          onOpenChange={handleOpenChange}
          title={sheetTitle}
          description={sheetDescription}
          keyboardInset={kind ? keyboardInset : 0}
          className={cn(
            showingPicker ? "max-h-[min(72dvh,520px)]" : "max-h-[min(92dvh,720px)]",
          )}
        >
          {showingPicker ? pickerInner : composeInner}
        </CommunityBottomSheet>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton
          className={cn(
            "hidden lg:flex lg:flex-col gap-0 p-0 overflow-hidden",
            "sm:max-w-lg max-h-[min(85dvh,36rem)]",
          )}
        >
          <DialogTitle className="sr-only">{sheetTitle}</DialogTitle>
          <div className="px-5 pt-5 pb-2 border-b border-black/[0.06]">
            <h2 className="font-serif text-lg text-brand-ink tracking-wide">
              {sheetTitle}
            </h2>
            {sheetDescription ? (
              <p className="mt-1 text-sm text-brand-ink/55">{sheetDescription}</p>
            ) : null}
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {showingPicker ? pickerInner : composeInner}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

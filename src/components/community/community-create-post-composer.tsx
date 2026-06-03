"use client";

import { useCallback, useEffect, useState } from "react";
import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunityPostType } from "@/lib/community/types";
import { useLgDesktop } from "@/lib/community/use-lg-desktop";
import { useVisualViewportKeyboardInset } from "@/hooks/use-visual-viewport-keyboard-inset";
import { CommunityBottomSheet } from "./community-bottom-sheet";
import { CommunityCreatePostForm } from "./community-create-post-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function logPostComposer(phase: string, detail?: Record<string, unknown>) {
  console.info("[mh-post-composer]", { phase, ...detail });
}

export function CommunityCreatePostComposer({
  open,
  onOpenChange,
  spaces,
  defaultSpaceId,
  defaultPostType,
  owner,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  spaces: CommunityComposerSpace[];
  defaultSpaceId?: string;
  defaultPostType?: CommunityPostType;
  owner?: CommunityOwner | null;
}) {
  const isDesktop = useLgDesktop();
  const [bodyFocused, setBodyFocused] = useState(false);
  const keyboardInset = useVisualViewportKeyboardInset(open && !isDesktop);

  useEffect(() => {
    if (open) {
      logPostComposer("sheet_opened", { isDesktop, defaultSpaceId: defaultSpaceId ?? null });
    }
  }, [open, isDesktop, defaultSpaceId]);

  useEffect(() => {
    if (!open) setBodyFocused(false);
  }, [open]);

  useEffect(() => {
    if (keyboardInset > 0) {
      logPostComposer("viewport_resize", { keyboardInset, bodyFocused });
    }
  }, [keyboardInset, bodyFocused]);

  const handleOpenChange = useCallback(
    (next: boolean, reason?: string) => {
      if (!next) {
        logPostComposer("sheet_close", { reason: reason ?? "unknown", isDesktop, keyboardInset });
      }
      onOpenChange(next);
    },
    [isDesktop, keyboardInset, onOpenChange],
  );

  function handleClose(reason: string) {
    handleOpenChange(false, reason);
  }

  const sharedFormProps = {
    spaces,
    defaultSpaceId,
    defaultPostType,
    owner,
    autoFocus: open,
    onSuccess: () => handleClose("success"),
    onCancel: () => handleClose("cancel"),
    onComposerFocusChange: setBodyFocused,
  };

  return (
    <>
      {!isDesktop ? (
        <CommunityBottomSheet
          open={open}
          onOpenChange={(next) => handleOpenChange(next, next ? "open" : "sheet_onOpenChange")}
          title="New post"
          description="Share an update, prayer, praise, or encouragement."
          keyboardInset={keyboardInset}
          guardDismissWhileKeyboard={keyboardInset > 0 || bodyFocused}
          className="max-h-[min(92dvh,720px)]"
        >
          <CommunityCreatePostForm {...sharedFormProps} compactHeader />
        </CommunityBottomSheet>
      ) : null}

      {isDesktop ? (
        <Dialog
          open={open}
          onOpenChange={(next) => handleOpenChange(next, next ? "open" : "dialog_onOpenChange")}
        >
          <DialogContent
            showCloseButton
            className={cn(
              "flex flex-col gap-0 p-0 overflow-hidden",
              "sm:max-w-lg max-h-[min(85dvh,40rem)]",
              "rounded-2xl border-brand-primary/15 bg-[#faf8f6]",
            )}
          >
            <DialogTitle className="sr-only">New post</DialogTitle>
            <div className="px-5 pt-4 pb-2 border-b border-brand-primary/10">
              <h2 className="font-serif text-lg text-brand-ink tracking-wide">New post</h2>
              <p className="mt-0.5 text-sm text-brand-ink/55">
                Share with your ministry family
              </p>
            </div>
            <div className="flex flex-col flex-1 min-h-0 px-5 py-3">
              <CommunityCreatePostForm {...sharedFormProps} />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}

"use client";

import type { CommunityComposerSpace } from "@/lib/community/composer-types";
import type { CommunityOwner } from "@/lib/community/owner-types";
import type { CommunityPostType } from "@/lib/community/types";
import { useVisualViewportKeyboardInset } from "@/hooks/use-visual-viewport-keyboard-inset";
import { CommunityBottomSheet } from "./community-bottom-sheet";
import { CommunityCreatePostForm } from "./community-create-post-form";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
  const keyboardInset = useVisualViewportKeyboardInset(open);

  function handleClose() {
    onOpenChange(false);
  }

  const form = (
    <CommunityCreatePostForm
      spaces={spaces}
      defaultSpaceId={defaultSpaceId}
      defaultPostType={defaultPostType}
      owner={owner}
      autoFocus={open}
      compactHeader
      onSuccess={handleClose}
      onCancel={handleClose}
    />
  );

  return (
    <>
      <div className="lg:hidden">
        <CommunityBottomSheet
          open={open}
          onOpenChange={onOpenChange}
          title="New post"
          description="Share an update, prayer, praise, or encouragement."
          keyboardInset={keyboardInset}
          className="max-h-[min(92dvh,720px)]"
        >
          {form}
        </CommunityBottomSheet>
      </div>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className={cn(
            "hidden lg:flex lg:flex-col gap-0 p-0 overflow-hidden",
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
          <div className="flex flex-col flex-1 min-h-0 px-5 py-3">{form}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}

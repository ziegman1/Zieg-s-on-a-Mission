"use client";

import { useState } from "react";
import { CommunityBottomSheet } from "./community-bottom-sheet";
import { CommunityCreateSpaceCompactForm } from "./community-create-space-compact-form";
import { CommunitySpaceExperienceForm } from "./community-space-experience-form";
import { createCommunitySpaceAction } from "@/app/admin/community/actions";
import {
  emptySpaceForm,
  spaceFormToPayload,
  type SpaceFormState,
} from "@/lib/community/space-form-state";
import { slugifyCommunityTitle } from "@/lib/community/slug";
import { useVisualViewportKeyboardInset } from "@/hooks/use-visual-viewport-keyboard-inset";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

/** Mobile sheet + desktop dialog for creating a space. */
export function CommunityCreateSpaceFlow({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const keyboardInset = useVisualViewportKeyboardInset(open);
  const [form, setForm] = useState<SpaceFormState>(() => ({
    ...emptySpaceForm(),
    status: "published",
  }));
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setForm({ ...emptySpaceForm(), status: "published" });
    setSlugTouched(false);
    setError(null);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function onTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: slugTouched ? f.slug : slugifyCommunityTitle(title),
    }));
  }

  function finishSpaceCreated(slug: string) {
    handleOpenChange(false);
    router.refresh();
    router.push(`/community/${slug}`);
  }

  function handleDesktopSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = spaceFormToPayload(form);
    startTransition(async () => {
      const res = await createCommunitySpaceAction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      finishSpaceCreated(res.slug);
    });
  }

  const desktopForm = (
    <form onSubmit={handleDesktopSubmit} className="space-y-4 pt-1">
      <CommunitySpaceExperienceForm
        form={form}
        setForm={setForm}
        onTitleChange={onTitleChange}
        slugTouched={slugTouched}
        setSlugTouched={setSlugTouched}
        variant="light"
        showStatus
        showSortOrder={false}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-brand-primary hover:bg-brand-primary/90"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
            Creating…
          </>
        ) : (
          "Create space"
        )}
      </Button>
    </form>
  );

  return (
    <>
      <div className="lg:hidden">
        <CommunityBottomSheet
          open={open}
          onOpenChange={handleOpenChange}
          title="New space"
          description="Create a room for prayer, updates, testimony, or connection."
          keyboardInset={keyboardInset}
        >
          <CommunityCreateSpaceCompactForm
            autoFocus={open}
            onCreated={finishSpaceCreated}
          />
        </CommunityBottomSheet>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className={cn(
            "hidden lg:block sm:max-w-lg max-h-[min(92vh,44rem)] overflow-y-auto",
            "rounded-2xl border-brand-primary/15 bg-[#faf8f6] p-5 sm:p-6",
          )}
        >
          <DialogHeader className="text-left">
            <DialogTitle className="font-serif text-brand-primary text-xl tracking-wide">
              New space
            </DialogTitle>
            <DialogDescription className="text-brand-ink/65 text-sm">
              Create an intentional room for your ministry family.
            </DialogDescription>
          </DialogHeader>
          {desktopForm}
        </DialogContent>
      </Dialog>
    </>
  );
}

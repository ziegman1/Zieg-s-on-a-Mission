"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createCommunitySpaceAction } from "@/app/admin/community/actions";
import { CommunitySpaceExperienceForm } from "@/components/community/community-space-experience-form";
import {
  emptySpaceForm,
  spaceFormToPayload,
  type SpaceFormState,
} from "@/lib/community/space-form-state";
import { slugifyCommunityTitle } from "@/lib/community/slug";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function CommunityCreateSpaceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
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

  function onTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: slugTouched ? f.slug : slugifyCommunityTitle(title),
    }));
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = spaceFormToPayload(form);
    startTransition(async () => {
      const res = await createCommunitySpaceAction(payload);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-lg max-h-[min(92vh,44rem)] overflow-y-auto",
          "rounded-t-3xl sm:rounded-2xl border-brand-primary/15 bg-[#faf8f6] p-5 sm:p-6",
          "fixed bottom-0 top-auto left-0 right-0 translate-x-0 translate-y-0 sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:bottom-auto",
          "w-full max-w-none sm:max-w-lg data-[state=open]:slide-in-from-bottom sm:data-[state=open]:slide-in-from-bottom-0",
        )}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="font-serif text-brand-primary text-xl tracking-wide">
            New space
          </DialogTitle>
          <DialogDescription className="text-brand-ink/65 text-sm">
            Create an intentional room for prayer, updates, testimony, or connection — not just a
            feed category.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
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
      </DialogContent>
    </Dialog>
  );
}

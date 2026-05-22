"use client";

import * as React from "react";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function BottomSheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-[60] bg-black/45",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function BottomSheetContent({
  className,
  children,
  title,
  description,
  onClose,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  description?: string;
  onClose?: () => void;
}) {
  return (
    <DialogPrimitive.Portal>
      <BottomSheetOverlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-[61] flex max-h-[min(92dvh,720px)] w-full flex-col",
          "rounded-t-[1.35rem] bg-white shadow-[0_-12px_40px_rgba(30,54,68,0.14)] outline-none",
          "border-t border-black/[0.06]",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "duration-300 ease-out",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          className,
        )}
        {...props}
      >
        <div className="flex shrink-0 justify-center pt-2.5 pb-1" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-black/12" />
        </div>
        <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-3">
          <div className="min-w-0">
            <DialogPrimitive.Title className="font-serif text-lg font-medium tracking-wide text-brand-ink">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-0.5 text-sm text-brand-ink/55">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-brand-ink/55 hover:bg-black/[0.04] hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35"
          >
            <XIcon className="h-5 w-5" aria-hidden />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function CommunityBottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent
        title={title}
        description={description}
        onClose={() => onOpenChange(false)}
        className={className}
      >
        {children}
      </BottomSheetContent>
    </DialogPrimitive.Root>
  );
}

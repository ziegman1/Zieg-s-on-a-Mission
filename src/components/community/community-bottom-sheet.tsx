"use client";

import * as React from "react";
import { useRef } from "react";
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
        "fixed inset-0 z-[60] bg-black/35 backdrop-blur-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "duration-300",
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
  onSwipeClose,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  description?: string;
  onClose?: () => void;
  onSwipeClose?: () => void;
}) {
  const dragRef = useRef({ startY: 0, dragging: false });

  function onHandlePointerDown(e: React.PointerEvent) {
    dragRef.current = { startY: e.clientY, dragging: true };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onHandlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current.dragging) return;
    const dy = e.clientY - dragRef.current.startY;
    if (dy > 72 && onSwipeClose) onSwipeClose();
  }

  function onHandlePointerUp() {
    dragRef.current.dragging = false;
  }

  return (
    <DialogPrimitive.Portal>
      <BottomSheetOverlay />
      <DialogPrimitive.Content
        className={cn(
          "mh-sheet-content fixed inset-x-0 bottom-0 z-[61] flex max-h-[min(92dvh,720px)] w-full flex-col",
          "rounded-t-[1.35rem] bg-white/98 shadow-[0_-16px_48px_rgba(30,54,68,0.12)] outline-none",
          "border-t border-black/[0.05] backdrop-blur-xl",
          "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          className,
        )}
        {...props}
      >
        <div
          className="flex shrink-0 cursor-grab touch-none justify-center pt-2.5 pb-1 active:cursor-grabbing"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
          aria-hidden
        >
          <div className="h-1 w-11 rounded-full bg-black/14" />
        </div>
        <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-2.5">
          <div className="min-w-0">
            <DialogPrimitive.Title className="font-serif text-lg font-medium tracking-wide text-brand-ink">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="mt-0.5 text-sm text-brand-ink/52 leading-snug">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          <DialogPrimitive.Close
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              "text-brand-ink/50 hover:bg-black/[0.04] hover:text-brand-ink",
              "active:scale-[0.96] transition-transform duration-75",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
            )}
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
        onSwipeClose={() => onOpenChange(false)}
        className={className}
      >
        {children}
      </BottomSheetContent>
    </DialogPrimitive.Root>
  );
}

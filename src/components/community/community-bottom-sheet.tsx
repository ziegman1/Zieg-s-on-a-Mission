"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
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
  open,
  onClose,
  onSwipeClose,
  keyboardInset = 0,
  guardDismissWhileKeyboard = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  description?: string;
  open: boolean;
  onClose?: () => void;
  onSwipeClose?: () => void;
  keyboardInset?: number;
  /** When true, ignore outside-focus/pointer dismiss (mobile keyboard resize). */
  guardDismissWhileKeyboard?: boolean;
}) {
  const dragRef = useRef({ startY: 0, dragging: false });
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      bodyRef.current?.scrollTo({ top: 0 });
    }
  }, [open, title]);

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

  const keyboardMaxHeight =
    keyboardInset > 0
      ? `calc(100dvh - env(safe-area-inset-top, 0px) - ${keyboardInset}px - 0.5rem)`
      : undefined;

  function guardOutsideDismiss(event: Event, kind: string) {
    if (!guardDismissWhileKeyboard) return;
    event.preventDefault();
    console.info("[mh-bottom-sheet]", { phase: "dismiss_blocked", kind, keyboardInset });
  }

  return (
    <DialogPrimitive.Portal>
      <BottomSheetOverlay />
      <DialogPrimitive.Content
        className={cn(
          "mh-sheet-content fixed inset-x-0 bottom-0 z-[61] flex w-full flex-col",
          "max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top,0px)-0.5rem))]",
          "rounded-t-[1.35rem] bg-white/98 shadow-[0_-16px_48px_rgba(30,54,68,0.12)] outline-none",
          "border-t border-black/[0.05] backdrop-blur-xl",
          className,
        )}
        style={keyboardMaxHeight ? { maxHeight: keyboardMaxHeight } : undefined}
        onPointerDownOutside={(e) => guardOutsideDismiss(e, "pointerDownOutside")}
        onInteractOutside={(e) => guardOutsideDismiss(e, "interactOutside")}
        onFocusOutside={(e) => guardOutsideDismiss(e, "focusOutside")}
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
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-black/[0.05] bg-white/98 px-4 pb-3 pt-0.5">
          <div className="min-w-0 pr-2">
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
        <div
          ref={bodyRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-4 mh-scrollbar-none"
          style={{
            paddingBottom: `calc(1rem + ${keyboardInset}px + env(safe-area-inset-bottom, 0px))`,
            WebkitOverflowScrolling: "touch",
          }}
        >
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
  keyboardInset = 0,
  guardDismissWhileKeyboard = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Extra bottom padding when the on-screen keyboard is open (px). */
  keyboardInset?: number;
  guardDismissWhileKeyboard?: boolean;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent
        open={open}
        title={title}
        description={description}
        onClose={() => onOpenChange(false)}
        onSwipeClose={() => onOpenChange(false)}
        className={className}
        keyboardInset={keyboardInset}
        guardDismissWhileKeyboard={guardDismissWhileKeyboard}
      >
        {children}
      </BottomSheetContent>
    </DialogPrimitive.Root>
  );
}

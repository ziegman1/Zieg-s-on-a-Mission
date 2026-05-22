import { cn } from "@/lib/utils";

/** Instant tap feedback for Mission Hub navigation controls */
export const navTapBase = cn(
  "transition-[transform,background-color,color,box-shadow] duration-75 ease-out",
  "touch-manipulation select-none",
  "active:scale-[0.98]",
);

export const navTapPressed = "active:bg-black/[0.06]";

export function navTapActive(active: boolean, pending: boolean): string {
  return cn(
    active && !pending && "bg-brand-primary/12 text-brand-primary",
    pending && "bg-brand-primary/18 text-brand-primary shadow-[inset_0_0_0_1px_rgba(131,176,218,0.25)]",
  );
}

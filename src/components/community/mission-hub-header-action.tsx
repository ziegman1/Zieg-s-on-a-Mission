"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Lightweight owner create control — text-first, not a heavy CTA block. */
export function MissionHubHeaderAction({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1",
        "text-[12.5px] font-medium text-brand-primary/90",
        "bg-white/70 ring-1 ring-brand-primary/14",
        "hover:bg-white hover:ring-brand-primary/28 hover:text-brand-primary",
        "active:scale-[0.98] touch-manipulation transition-all duration-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
        className,
      )}
    >
      <Plus className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      <span>{label}</span>
    </button>
  );
}

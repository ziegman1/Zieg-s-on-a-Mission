"use client";

import type { CtaAlign } from "@/lib/newsletter/align";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const OPTIONS: { value: CtaAlign; label: string }[] = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export function CtaAlignmentControl({
  value,
  onChange,
  label = "Alignment",
  disabled = false,
}: {
  value: CtaAlign;
  onChange: (align: CtaAlign) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5" data-testid="cta-alignment-control">
      <Label className="text-zinc-400 text-xs">{label}</Label>
      <div
        className="inline-flex rounded-lg border border-zinc-700 overflow-hidden"
        role="group"
        aria-label={label}
      >
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors",
              value === opt.value
                ? "bg-brand-primary/30 text-zinc-100"
                : "bg-zinc-900 text-zinc-400 hover:text-zinc-200",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

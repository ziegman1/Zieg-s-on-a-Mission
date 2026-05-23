"use client";

import { memo } from "react";
import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import { BLOCK_TYPE_LABELS } from "@/lib/newsletter/blocks/factory";
import type { NewsletterBlock } from "@/lib/newsletter/blocks/types";
import { NewsletterBlockEditor } from "@/components/newsletter/newsletter-block-editor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ComposerBlockRow = memo(function ComposerBlockRow({
  block,
  index,
  total,
  selected,
  newsletterId,
  onSelect,
  onMove,
  onDuplicate,
  onRemove,
  onChange,
}: {
  block: NewsletterBlock;
  index: number;
  total: number;
  selected: boolean;
  newsletterId?: string;
  onSelect: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onChange: (id: string, next: NewsletterBlock) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        selected
          ? "border-brand-primary/50 bg-zinc-900 shadow-sm"
          : "border-zinc-800 bg-zinc-900/70 hover:border-zinc-600",
      )}
    >
      <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-800/80">
        <button
          type="button"
          className="flex-1 text-left text-sm font-medium text-zinc-200"
          onClick={() => onSelect(block.id)}
        >
          {BLOCK_TYPE_LABELS[block.type]}
        </button>
        <div className="flex shrink-0 gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={index === 0}
            onClick={() => onMove(block.id, -1)}
            aria-label="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={index === total - 1}
            onClick={() => onMove(block.id, 1)}
            aria-label="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDuplicate(block.id)}
            aria-label="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-400"
            onClick={() => onRemove(block.id)}
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {selected ? (
        <div className="p-4">
          <NewsletterBlockEditor
            block={block}
            newsletterId={newsletterId}
            onChange={(next) => onChange(block.id, next)}
          />
        </div>
      ) : null}
    </div>
  );
});

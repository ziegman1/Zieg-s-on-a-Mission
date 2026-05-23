"use client";

import { useCallback, useState } from "react";
import {
  Columns2,
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Smartphone,
} from "lucide-react";
import { BLOCK_TYPE_LABELS, createNewsletterBlock } from "@/lib/newsletter/blocks/factory";
import {
  NEWSLETTER_BLOCK_TYPES,
  type NewsletterBlock,
  type NewsletterBlocks,
} from "@/lib/newsletter/blocks/types";
import { hasVisibleNewsletterContent } from "@/lib/newsletter/blocks/visible";
import type { CtaAlign } from "@/lib/newsletter/align";
import type { NewsletterBrandSettings } from "@/lib/newsletter/brand-types";
import {
  type NewsletterComposerLayoutMode,
  composerModeButtonClass,
  shouldShowComposerEditor,
  shouldShowComposerPreview,
} from "@/lib/newsletter/composer-layout";
import { perfMark } from "@/lib/newsletter/composer-perf";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { ComposerBlockRow } from "@/components/newsletter/composer-block-row";
import { NewsletterComposerPreviewPane } from "@/components/newsletter/newsletter-composer-preview-pane";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NewsletterComposerMeta = {
  title: string;
  subtitle: string;
  excerpt: string;
  featuredImageUrl: string;
  headerImageUrl: string;
  useDefaultBrandedHeader: boolean;
  issueDateLabel?: string;
  ctaLabel: string;
  ctaUrl: string;
  ctaAlign: CtaAlign;
  footerImageUrl: string;
  footerAltText: string;
  useDefaultFooterImage: boolean;
};

const PREVIEW_DEBOUNCE_MS = 250;

export function NewsletterEditorWorkspace({
  blocks,
  onBlocksChange,
  meta,
  brand,
  layoutMode,
  onLayoutModeChange,
  onOpenSettings,
  newsletterId,
}: {
  blocks: NewsletterBlocks;
  onBlocksChange: (blocks: NewsletterBlocks) => void;
  meta: NewsletterComposerMeta;
  brand: NewsletterBrandSettings;
  layoutMode: NewsletterComposerLayoutMode;
  onLayoutModeChange: (mode: NewsletterComposerLayoutMode) => void;
  onOpenSettings: () => void;
  newsletterId?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(blocks[0]?.id ?? null);
  const [railExpanded, setRailExpanded] = useState(true);
  const [mobilePreview, setMobilePreview] = useState(false);

  const debouncedBlocks = useDebouncedValue(blocks, PREVIEW_DEBOUNCE_MS);
  const debouncedMeta = useDebouncedValue(meta, PREVIEW_DEBOUNCE_MS);

  const showEditor = shouldShowComposerEditor(layoutMode);
  const showPreview = shouldShowComposerPreview(layoutMode);
  const publishReady = hasVisibleNewsletterContent("", blocks);

  const updateBlock = useCallback(
    (id: string, next: NewsletterBlock) => {
      perfMark("block-update", { id, type: next.type });
      onBlocksChange(blocks.map((b) => (b.id === id ? next : b)));
    },
    [blocks, onBlocksChange],
  );

  const addBlock = useCallback(
    (type: (typeof NEWSLETTER_BLOCK_TYPES)[number]) => {
      perfMark("block-add", type);
      const block = createNewsletterBlock(type);
      onBlocksChange([...blocks, block]);
      setSelectedId(block.id);
    },
    [blocks, onBlocksChange],
  );

  const removeBlock = useCallback(
    (id: string) => {
      perfMark("block-remove", id);
      const next = blocks.filter((b) => b.id !== id);
      onBlocksChange(next);
      setSelectedId((current) => (current === id ? (next[0]?.id ?? null) : current));
    },
    [blocks, onBlocksChange],
  );

  const duplicateBlock = useCallback(
    (id: string) => {
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx < 0) return;
      const src = blocks[idx]!;
      const copy = { ...src, id: createNewsletterBlock(src.type).id };
      const next = [...blocks.slice(0, idx + 1), copy, ...blocks.slice(idx + 1)];
      onBlocksChange(next);
      setSelectedId(copy.id);
    },
    [blocks, onBlocksChange],
  );

  const moveBlock = useCallback(
    (id: string, dir: -1 | 1) => {
      const idx = blocks.findIndex((b) => b.id === id);
      if (idx < 0) return;
      const target = idx + dir;
      if (target < 0 || target >= blocks.length) return;
      const next = [...blocks];
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item!);
      onBlocksChange(next);
    },
    [blocks, onBlocksChange],
  );

  return (
    <div className="flex flex-1 min-h-0 flex-col" data-testid="newsletter-composer">
      <div className="shrink-0 border-b border-zinc-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 bg-zinc-950/95 z-20">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div
            className="flex rounded-lg border border-zinc-700 p-0.5 text-xs"
            role="tablist"
            aria-label="Composer layout"
          >
            {(
              [
                { mode: "edit" as const, label: "Edit", icon: Pencil },
                { mode: "split" as const, label: "Split", icon: Columns2 },
                { mode: "preview" as const, label: "Preview", icon: LayoutTemplate },
              ] as const
            ).map(({ mode, label, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={layoutMode === mode}
                data-testid={`composer-mode-${mode}`}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors",
                  composerModeButtonClass(layoutMode === mode),
                )}
                onClick={() => onLayoutModeChange(mode)}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-400" data-testid="composer-block-count">
            {blocks.length} block{blocks.length === 1 ? "" : "s"}
            {!publishReady ? (
              <span className="text-amber-500/90 font-medium">
                {" "}
                — add content to publish
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {showPreview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 text-xs",
                mobilePreview && "bg-zinc-800 text-zinc-200",
              )}
              onClick={() => setMobilePreview((v) => !v)}
              title="Toggle mobile preview width"
            >
              <Smartphone className="h-3.5 w-3.5 mr-1" />
              Mobile
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs border-zinc-700"
            onClick={onOpenSettings}
            data-testid="composer-open-settings"
          >
            Settings
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {showEditor ? (
          <aside
            className={cn(
              "shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col transition-[width] duration-200 overflow-hidden",
              railExpanded ? "w-44" : "w-11",
            )}
            data-testid="composer-block-rail"
          >
            <div className="flex items-center justify-between px-2 py-2 border-b border-zinc-800/80">
              {railExpanded ? (
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 px-1">
                  Blocks
                </p>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 ml-auto"
                onClick={() => setRailExpanded((v) => !v)}
                aria-label={railExpanded ? "Collapse block panel" : "Expand block panel"}
              >
                {railExpanded ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeftOpen className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {NEWSLETTER_BLOCK_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant="outline"
                  size="sm"
                  title={BLOCK_TYPE_LABELS[type]}
                  className={cn(
                    "border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs",
                    railExpanded ? "w-full justify-start h-8" : "h-8 w-8 p-0 justify-center",
                  )}
                  onClick={() => addBlock(type)}
                >
                  <Plus className="h-3 w-3 shrink-0" />
                  {railExpanded ? (
                    <span className="truncate ml-1">{BLOCK_TYPE_LABELS[type]}</span>
                  ) : null}
                </Button>
              ))}
            </div>
          </aside>
        ) : null}

        <div className="flex flex-1 min-w-0 min-h-0">
          {showEditor ? (
            <div
              className={cn(
                "min-h-0 overflow-y-auto bg-zinc-950/50",
                layoutMode === "split" ? "w-1/2 min-w-0 border-r border-zinc-800" : "flex-1",
              )}
              data-testid="composer-editor-pane"
            >
              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4">
                {blocks.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-6 py-16 text-center">
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      Add blocks from the left toolbar to build your newsletter.
                    </p>
                    <p className="text-xs text-amber-500/80 mt-2">
                      0 blocks — add content to publish
                    </p>
                  </div>
                ) : (
                  blocks.map((block, index) => (
                    <ComposerBlockRow
                      key={block.id}
                      block={block}
                      index={index}
                      total={blocks.length}
                      selected={selectedId === block.id}
                      newsletterId={newsletterId}
                      onSelect={setSelectedId}
                      onMove={moveBlock}
                      onDuplicate={duplicateBlock}
                      onRemove={removeBlock}
                      onChange={updateBlock}
                    />
                  ))
                )}
              </div>
            </div>
          ) : null}

          {showPreview ? (
            <div
              className={cn(
                "min-h-0 overflow-y-auto",
                layoutMode === "split" ? "w-1/2 min-w-0 bg-zinc-900/30" : "flex-1 bg-zinc-900/40",
              )}
            >
              <NewsletterComposerPreviewPane
                blocks={debouncedBlocks}
                meta={debouncedMeta}
                brand={brand}
                mobilePreview={mobilePreview}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

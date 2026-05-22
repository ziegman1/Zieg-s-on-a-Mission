"use client";

import { useCallback, useMemo, useState } from "react";
import type { BlockType, ContentBlock } from "@/lib/site-copy-blocks/types";
import { SITE_COPY_PAGE_TABS } from "@/lib/site-copy-blocks/types";
import {
  groupBlocksBySection,
  moveItem,
  newBlockId,
  reindexBlocks,
  sortBlocks,
} from "@/lib/site-copy-blocks/utils";
import {
  restoreAllSiteCopyDefaultsAction,
  resetSiteCopySectionAction,
  saveSiteCopyBlocksAction,
} from "./actions";
import { ContentBlockCard } from "./content-block-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const ADD_BLOCK_TYPES: BlockType[] = [
  "text",
  "textarea",
  "heading",
  "bullet_list",
  "structured_list",
  "cta",
  "image",
];

function sectionLabel(sectionKey: string): string {
  return sectionKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function FlexibleSiteCopyEditor({ initialBlocks }: { initialBlocks: ContentBlock[] }) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => sortBlocks(initialBlocks));
  const [activePage, setActivePage] = useState(SITE_COPY_PAGE_TABS[0]!.pageKey);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmRestoreAll, setConfirmRestoreAll] = useState(false);

  const sections = useMemo(
    () => groupBlocksBySection(blocks, activePage),
    [blocks, activePage],
  );

  const updateBlock = useCallback((id: string, next: ContentBlock) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? next : b)));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks((prev) => reindexBlocks(prev.filter((b) => b.id !== id)));
  }, []);

  const duplicateBlock = useCallback((block: ContentBlock) => {
    const copy: ContentBlock = {
      ...structuredClone(block),
      id: newBlockId(),
      blockKey: `${block.blockKey}.custom_${Date.now()}`,
      label: `${block.label} (copy)`,
      sortOrder: blocks.length,
    };
    setBlocks((prev) => reindexBlocks([...prev, copy]));
  }, [blocks.length]);

  const moveBlock = useCallback((pageKey: string, sectionKey: string, index: number, dir: -1 | 1) => {
    setBlocks((prev) => {
      const sectionBlocks = prev.filter((b) => b.pageKey === pageKey && b.sectionKey === sectionKey);
      const rest = prev.filter((b) => !(b.pageKey === pageKey && b.sectionKey === sectionKey));
      const moved = moveItem(sectionBlocks, index, index + dir);
      return reindexBlocks([...rest, ...moved.map((b, i) => ({ ...b, sortOrder: i }))]);
    });
  }, []);

  async function handleSave() {
    setStatus("saving");
    setErrorMsg(null);
    const res = await saveSiteCopyBlocksAction(blocks);
    if (!res.ok) {
      setStatus("error");
      setErrorMsg(res.error + (res.details ? ` — ${JSON.stringify(res.details)}` : ""));
      return;
    }
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2500);
  }

  async function handleRestoreAll() {
    const res = await restoreAllSiteCopyDefaultsAction();
    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }
    setBlocks(sortBlocks(res.blocks));
    setConfirmRestoreAll(false);
  }

  async function handleResetSection(pageKey: string, sectionKey: string) {
    const res = await resetSiteCopySectionAction(pageKey, sectionKey, blocks);
    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }
    setBlocks(sortBlocks(res.blocks));
  }

  function addBlock(pageKey: string, sectionKey: string, blockType: BlockType) {
    const id = newBlockId();
    const block: ContentBlock = {
      id,
      pageKey,
      sectionKey,
      blockKey: `${pageKey}.${sectionKey}.${id}`,
      blockType,
      label: "New content block",
      value: "",
      lines: blockType === "bullet_list" || blockType === "structured_list" ? [] : [],
      visible: true,
      sortOrder: blocks.length,
      metadata: {},
    };
    setBlocks((prev) => reindexBlocks([...prev, block]));
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
          Edit content blocks by page. Hidden blocks and lines are not shown on the storefront.
          Deleting removes them from your saved config (defaults do not fill in deleted items).
          First save migrates legacy copy into this flexible format.
        </p>
        <div className="flex flex-wrap gap-2">
          {confirmRestoreAll ? (
            <>
              <Button type="button" variant="destructive" size="sm" onClick={() => void handleRestoreAll()}>
                Confirm restore all defaults
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmRestoreAll(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmRestoreAll(true)}>
              Restore all defaults
            </Button>
          )}
          <Button type="button" size="sm" onClick={() => void handleSave()} disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save all changes"}
          </Button>
        </div>
      </div>

      {status === "saved" && (
        <p className="text-sm text-emerald-400">Saved. Storefront pages were refreshed.</p>
      )}
      {errorMsg && <p className="text-sm text-red-400 whitespace-pre-wrap">{errorMsg}</p>}

      <div className="flex flex-wrap gap-1 border-b border-zinc-800 pb-2">
        {SITE_COPY_PAGE_TABS.map((tab) => (
          <button
            key={tab.pageKey}
            type="button"
            onClick={() => setActivePage(tab.pageKey)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              activePage === tab.pageKey
                ? "bg-brand-primary text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {SITE_COPY_PAGE_TABS.find((t) => t.pageKey === activePage)?.description ? (
        <p className="text-xs text-zinc-500">
          {SITE_COPY_PAGE_TABS.find((t) => t.pageKey === activePage)?.description}
        </p>
      ) : null}

      {[...sections.entries()].map(([sectionKey, sectionBlocks]) => (
        <details
          key={sectionKey}
          open
          className="rounded-lg border border-brand-primary/25 bg-zinc-900/40"
        >
          <summary className="cursor-pointer px-4 py-3 font-medium text-brand-primary flex flex-wrap items-center justify-between gap-2">
            <span>{sectionLabel(sectionKey)}</span>
            <span
              className="text-xs text-zinc-500 font-normal"
              onClick={(e) => e.preventDefault()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => void handleResetSection(activePage, sectionKey)}
              >
                Reset section to default
              </Button>
            </span>
          </summary>
          <div className="px-4 pb-4 space-y-3">
            {sectionBlocks.map((block, index) => (
              <ContentBlockCard
                key={block.id}
                block={block}
                onChange={(next) => updateBlock(block.id, next)}
                onDelete={() => deleteBlock(block.id)}
                onDuplicate={() => duplicateBlock(block)}
                onMoveUp={() => moveBlock(activePage, sectionKey, index, -1)}
                onMoveDown={() => moveBlock(activePage, sectionKey, index, 1)}
                canMoveUp={index > 0}
                canMoveDown={index < sectionBlocks.length - 1}
              />
            ))}

            <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-zinc-800">
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">Add block</Label>
                <select
                  className="h-9 rounded-md border border-zinc-700 bg-zinc-950 px-2 text-sm text-zinc-200"
                  defaultValue="text"
                  id={`add-type-${activePage}-${sectionKey}`}
                >
                  {ADD_BLOCK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const sel = document.getElementById(
                    `add-type-${activePage}-${sectionKey}`,
                  ) as HTMLSelectElement | null;
                  const type = (sel?.value ?? "text") as BlockType;
                  addBlock(activePage, sectionKey, type);
                }}
              >
                Add block to section
              </Button>
            </div>
          </div>
        </details>
      ))}

      {sections.size === 0 ? (
        <p className="text-sm text-zinc-500">No blocks on this page. Add a section by switching pages or restoring defaults.</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="button" onClick={() => void handleSave()} disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save all changes"}
        </Button>
      </div>
    </div>
  );
}

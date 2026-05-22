"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
} from "lucide-react";
import type { ContentBlock, ContentLine } from "@/lib/site-copy-blocks/types";
import { newLineId, reindexLines } from "@/lib/site-copy-blocks/utils";
import { AdminImageUrlField } from "./admin-image-url-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ContentBlockCard({
  block,
  onChange,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  block: ContentBlock;
  onChange: (next: ContentBlock) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isList = block.blockType === "bullet_list" || block.blockType === "structured_list";
  const isImage = block.blockType === "image";
  const isLong =
    block.blockType === "textarea" ||
    block.blockType === "rich_text" ||
    block.blockType === "quote";

  function updateLines(lines: ContentLine[]) {
    onChange({ ...block, lines: reindexLines(lines) });
  }

  function addLine() {
    updateLines([
      ...block.lines,
      { id: newLineId(), text: "", visible: true, sortOrder: block.lines.length },
    ]);
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-4 space-y-3 transition-opacity",
        block.visible
          ? "border-zinc-700 bg-zinc-950/50"
          : "border-zinc-800 bg-zinc-950/20 opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5 pt-1 shrink-0">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
            aria-label="Move block up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <GripVertical className="h-4 w-4 text-zinc-600 mx-auto" aria-hidden />
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            className="p-1 text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
            aria-label="Move block down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={block.label}
              onChange={(e) => onChange({ ...block, label: e.target.value })}
              className="h-8 text-sm font-medium flex-1 min-w-[12rem]"
              aria-label="Block label"
            />
            <span className="text-[10px] uppercase tracking-wide text-zinc-500 shrink-0">
              {block.blockType.replace("_", " ")}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 font-mono truncate">{block.blockKey}</p>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onChange({ ...block, visible: !block.visible })}
            title={block.visible ? "Hide on site" : "Show on site"}
          >
            {block.visible ? (
              <Eye className="h-4 w-4 text-emerald-400" />
            ) : (
              <EyeOff className="h-4 w-4 text-zinc-500" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onDuplicate}
            title="Duplicate block"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {confirmDelete ? (
            <div className="flex gap-1 items-center">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  onDelete();
                  setConfirmDelete(false);
                }}
              >
                Delete
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-400"
              onClick={() => setConfirmDelete(true)}
              title="Delete block"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {!isList && !isImage ? (
        <div>
          <Label className="text-zinc-400 text-xs">Content</Label>
          {isLong ? (
            <Textarea
              rows={4}
              value={block.value}
              onChange={(e) => onChange({ ...block, value: e.target.value })}
              className="mt-1"
            />
          ) : (
            <Input
              value={block.value}
              onChange={(e) => onChange({ ...block, value: e.target.value })}
              className="mt-1"
            />
          )}
        </div>
      ) : null}

      {isImage ? (
        <AdminImageUrlField
          label="Image URL"
          value={block.value}
          onChange={(value) => onChange({ ...block, value })}
        />
      ) : null}

      {block.blockType === "structured_list" && block.blockKey.startsWith("homeGuided.section.") ? (
        <AdminImageUrlField
          label="Section image URL"
          value={String(block.metadata?.imageUrl ?? "")}
          onChange={(imageUrl) =>
            onChange({ ...block, metadata: { ...block.metadata, imageUrl } })
          }
        />
      ) : null}

      {isList ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-zinc-400 text-xs">Lines / items</Label>
            <Button type="button" variant="outline" size="sm" onClick={addLine}>
              Add line
            </Button>
          </div>
          {block.lines.map((line, lineIndex) => (
            <LineRow
              key={line.id}
              line={line}
              block={block}
              onChange={(nextLine) => {
                const lines = [...block.lines];
                lines[lineIndex] = nextLine;
                updateLines(lines);
              }}
              onDelete={() => updateLines(block.lines.filter((_, i) => i !== lineIndex))}
              onMoveUp={() => {
                if (lineIndex === 0) return;
                const lines = [...block.lines];
                [lines[lineIndex - 1], lines[lineIndex]] = [lines[lineIndex]!, lines[lineIndex - 1]!];
                updateLines(lines);
              }}
              onMoveDown={() => {
                if (lineIndex >= block.lines.length - 1) return;
                const lines = [...block.lines];
                [lines[lineIndex], lines[lineIndex + 1]] = [lines[lineIndex + 1]!, lines[lineIndex]!];
                updateLines(lines);
              }}
              canMoveUp={lineIndex > 0}
              canMoveDown={lineIndex < block.lines.length - 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LineRow({
  line,
  block,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  line: ContentLine;
  block: ContentBlock;
  onChange: (line: ContentLine) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isTier = block.blockKey.endsWith(".tiers");
  const isMilestone = block.blockKey.endsWith(".milestones");
  const isAbout = block.blockKey === "about.sections";
  const isGuidedBody = block.blockKey.startsWith("homeGuided.section.");

  return (
    <div
      className={cn(
        "rounded-md border border-zinc-800 p-2 space-y-2",
        !line.visible && "opacity-50",
      )}
    >
      <div className="flex gap-2 items-start">
        <div className="flex flex-col shrink-0">
          <button type="button" disabled={!canMoveUp} onClick={onMoveUp} className="p-0.5 text-zinc-500 disabled:opacity-30">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button type="button" disabled={!canMoveDown} onClick={onMoveDown} className="p-0.5 text-zinc-500 disabled:opacity-30">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          <Input
            value={line.text}
            placeholder={isAbout ? "Section heading" : "Line text"}
            onChange={(e) => onChange({ ...line, text: e.target.value })}
          />
          {isAbout || isGuidedBody ? (
            <Textarea
              rows={2}
              placeholder="Body"
              value={String(line.metadata?.body ?? "")}
              onChange={(e) =>
                onChange({ ...line, metadata: { ...line.metadata, body: e.target.value } })
              }
            />
          ) : null}
          {isGuidedBody && line.metadata?.field === "ctaLabel" ? (
            <Input
              placeholder="CTA label"
              value={line.text}
              onChange={(e) => onChange({ ...line, text: e.target.value })}
            />
          ) : null}
          {isTier ? (
            <>
              <Input
                placeholder="Amount label"
                value={String(line.metadata?.amountLabel ?? "")}
                onChange={(e) =>
                  onChange({ ...line, metadata: { ...line.metadata, amountLabel: e.target.value } })
                }
              />
              <Textarea
                rows={2}
                placeholder="Description"
                value={String(line.metadata?.description ?? "")}
                onChange={(e) =>
                  onChange({ ...line, metadata: { ...line.metadata, description: e.target.value } })
                }
              />
              <Input
                placeholder="Gift note"
                value={String(line.metadata?.giftNote ?? "")}
                onChange={(e) =>
                  onChange({ ...line, metadata: { ...line.metadata, giftNote: e.target.value } })
                }
              />
            </>
          ) : null}
          {isMilestone ? (
            <>
              <Input
                placeholder="When"
                value={String(line.metadata?.when ?? "")}
                onChange={(e) =>
                  onChange({ ...line, metadata: { ...line.metadata, when: e.target.value } })
                }
              />
              <Textarea
                rows={2}
                placeholder="Description"
                value={String(line.metadata?.description ?? "")}
                onChange={(e) =>
                  onChange({ ...line, metadata: { ...line.metadata, description: e.target.value } })
                }
              />
            </>
          ) : null}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onChange({ ...line, visible: !line.visible })}
          >
            {line.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </Button>
          {confirmDelete ? (
            <Button type="button" variant="destructive" size="sm" className="h-7 text-[10px] px-2" onClick={onDelete}>
              Yes
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-400"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

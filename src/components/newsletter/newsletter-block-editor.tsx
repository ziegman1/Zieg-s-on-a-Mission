"use client";

import type { NewsletterBlock } from "@/lib/newsletter/blocks/types";
import { CtaAlignmentControl } from "@/components/newsletter/cta-alignment-control";
import { NewsletterImageUploadField } from "@/components/newsletter/newsletter-image-upload-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const fieldClass = "bg-zinc-900 border-zinc-700 text-sm";

export function NewsletterBlockEditor({
  block,
  onChange,
  newsletterId,
}: {
  block: NewsletterBlock;
  onChange: (next: NewsletterBlock) => void;
  newsletterId?: string;
}) {
  switch (block.type) {
    case "text":
      return (
        <div className="space-y-1.5">
          <Label className="text-zinc-400 text-xs">Content (markdown)</Label>
          <Textarea
            value={block.content}
            onChange={(e) => onChange({ ...block, content: e.target.value })}
            rows={6}
            placeholder="Paragraphs, **bold**, ## headings…"
            className={cn(fieldClass, "resize-y min-h-[8rem] font-mono text-[13px]")}
          />
        </div>
      );
    case "heading":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-zinc-400 text-xs">Heading text</Label>
            <Input
              value={block.text}
              onChange={(e) => onChange({ ...block, text: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Level</Label>
            <select
              value={block.level}
              onChange={(e) =>
                onChange({
                  ...block,
                  level: e.target.value === "h3" ? "h3" : "h2",
                })
              }
              className={cn("w-full h-9 rounded-md border px-2", fieldClass)}
            >
              <option value="h2">Large (H2)</option>
              <option value="h3">Medium (H3)</option>
            </select>
          </div>
        </div>
      );
    case "image":
      return (
        <NewsletterImageUploadField
          label="Image"
          purpose="block"
          newsletterId={newsletterId}
          imageUrl={block.imageUrl}
          onImageUrlChange={(imageUrl) => onChange({ ...block, imageUrl })}
          altText={block.alt}
          onAltTextChange={(alt) => onChange({ ...block, alt })}
          altRequired
          caption={block.caption}
          onCaptionChange={(caption) => onChange({ ...block, caption })}
        />
      );
    case "image_text":
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Image position</Label>
            <select
              value={block.imagePosition}
              onChange={(e) =>
                onChange({
                  ...block,
                  imagePosition:
                    e.target.value === "right" || e.target.value === "top"
                      ? e.target.value
                      : "left",
                })
              }
              className={cn("w-full h-9 rounded-md border px-2", fieldClass)}
            >
              <option value="left">Image left</option>
              <option value="right">Image right</option>
              <option value="top">Image top</option>
            </select>
          </div>
          <NewsletterImageUploadField
            label="Image"
            purpose="block"
            newsletterId={newsletterId}
            imageUrl={block.imageUrl}
            onImageUrlChange={(imageUrl) => onChange({ ...block, imageUrl })}
            altText={block.alt}
            onAltTextChange={(alt) => onChange({ ...block, alt })}
            altRequired
          />
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Heading</Label>
            <Input
              value={block.heading}
              onChange={(e) => onChange({ ...block, heading: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Body</Label>
            <Textarea
              value={block.body}
              onChange={(e) => onChange({ ...block, body: e.target.value })}
              rows={4}
              className={cn(fieldClass, "resize-y")}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Button label</Label>
              <Input
                value={block.buttonLabel}
                onChange={(e) => onChange({ ...block, buttonLabel: e.target.value })}
                className={fieldClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-400 text-xs">Button URL</Label>
              <Input
                value={block.buttonUrl}
                onChange={(e) => onChange({ ...block, buttonUrl: e.target.value })}
                className={fieldClass}
              />
            </div>
          </div>
          {(block.buttonLabel.trim() || block.buttonUrl.trim()) && (
            <CtaAlignmentControl
              label="Button alignment"
              value={block.buttonAlign}
              onChange={(buttonAlign) => onChange({ ...block, buttonAlign })}
            />
          )}
        </div>
      );
    case "button":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Label</Label>
            <Input
              value={block.label}
              onChange={(e) => onChange({ ...block, label: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">URL</Label>
            <Input
              value={block.url}
              onChange={(e) => onChange({ ...block, url: e.target.value })}
              className={fieldClass}
            />
          </div>
          <div className="sm:col-span-2">
            <CtaAlignmentControl
              value={block.align}
              onChange={(align) => onChange({ ...block, align })}
            />
          </div>
        </div>
      );
    case "quote":
      return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Quote</Label>
            <Textarea
              value={block.text}
              onChange={(e) => onChange({ ...block, text: e.target.value })}
              rows={3}
              className={cn(fieldClass, "resize-y")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400 text-xs">Attribution</Label>
            <Input
              value={block.attribution}
              onChange={(e) => onChange({ ...block, attribution: e.target.value })}
              className={fieldClass}
            />
          </div>
        </div>
      );
    case "spacer":
      return (
        <div className="space-y-1.5">
          <Label className="text-zinc-400 text-xs">Spacer size</Label>
          <select
            value={block.size}
            onChange={(e) =>
              onChange({
                ...block,
                size:
                  e.target.value === "small" || e.target.value === "large"
                    ? e.target.value
                    : "medium",
              })
            }
            className={cn("w-full h-9 rounded-md border px-2", fieldClass)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      );
    case "divider":
      return (
        <p className="text-xs text-zinc-500 py-2">Horizontal divider — no settings.</p>
      );
    default:
      return null;
  }
}

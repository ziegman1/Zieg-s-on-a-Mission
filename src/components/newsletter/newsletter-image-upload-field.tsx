"use client";

import { useCallback, useRef, useState } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import {
  NEWSLETTER_IMAGE_ACCEPT,
  uploadNewsletterImageFile,
  type NewsletterImagePurpose,
} from "@/lib/newsletter/media-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function NewsletterImageUploadField({
  label,
  imageUrl,
  onImageUrlChange,
  purpose,
  helpText,
  altText,
  onAltTextChange,
  altRequired = false,
  caption,
  onCaptionChange,
  previewClassName,
  disabled = false,
}: {
  label: string;
  imageUrl: string;
  onImageUrlChange: (url: string) => void;
  purpose: NewsletterImagePurpose;
  helpText?: string;
  altText?: string;
  onAltTextChange?: (alt: string) => void;
  altRequired?: boolean;
  caption?: string;
  onCaptionChange?: (caption: string) => void;
  previewClassName?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewBroken, setPreviewBroken] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setPreviewBroken(false);
      setUploading(true);
      try {
        const { url } = await uploadNewsletterImageFile(file, purpose);
        onImageUrlChange(url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onImageUrlChange, purpose],
  );

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  const hasImage = Boolean(imageUrl.trim());

  return (
    <div className="space-y-2" data-testid={`newsletter-image-upload-${purpose}`}>
      <Label className="text-zinc-400 text-xs">{label}</Label>
      {helpText ? <p className="text-[10px] text-zinc-500 leading-relaxed">{helpText}</p> : null}

      {hasImage && !previewBroken ? (
        <div
          className={cn(
            "relative rounded-lg overflow-hidden ring-1 ring-zinc-700 bg-zinc-900/50",
            previewClassName ?? "max-w-md",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={altText?.trim() || label}
            className={cn(
              "w-full object-cover",
              purpose === "header" ? "h-auto" : "aspect-video",
            )}
            onError={() => setPreviewBroken(true)}
          />
          {!disabled ? (
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-xs bg-zinc-900/90"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                Replace
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-7 w-7 bg-zinc-900/90 text-red-400"
                disabled={uploading}
                onClick={() => {
                  onImageUrlChange("");
                  setPreviewBroken(false);
                }}
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : previewBroken ? (
        <p className="text-xs text-amber-500/90">Preview could not load — check the image URL.</p>
      ) : null}

      <div
        className={cn(
          "relative rounded-lg border border-dashed transition-colors",
          dragOver ? "border-brand-primary/60 bg-brand-primary/10" : "border-zinc-700 bg-zinc-900/40",
          disabled && "opacity-50 pointer-events-none",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={NEWSLETTER_IMAGE_ACCEPT}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={onFileInput}
        />
        <div className="flex flex-col items-center justify-center gap-2 px-4 py-6 text-center">
          {uploading ? (
            <Loader2 className="h-8 w-8 text-brand-primary animate-spin" aria-hidden />
          ) : (
            <ImageIcon className="h-8 w-8 text-zinc-600" aria-hidden />
          )}
          <p className="text-xs text-zinc-400">
            {uploading ? "Uploading…" : "Drag and drop an image, or"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full border-zinc-600 text-xs"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            Upload image
          </Button>
          <p className="text-[10px] text-zinc-500">JPG, PNG, or WebP · max 5 MB</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-500 text-[10px]">Or paste image URL</Label>
        <Input
          value={imageUrl}
          onChange={(e) => {
            setPreviewBroken(false);
            setError(null);
            onImageUrlChange(e.target.value);
          }}
          placeholder="https://…"
          disabled={disabled || uploading}
          className="bg-zinc-900 border-zinc-700 text-xs font-mono"
        />
      </div>

      {onAltTextChange ? (
        <div className="space-y-1.5">
          <Label className="text-zinc-400 text-xs">
            Alt text{altRequired ? " (required for publish)" : ""}
          </Label>
          <Input
            value={altText ?? ""}
            onChange={(e) => onAltTextChange(e.target.value)}
            disabled={disabled || uploading}
            className="bg-zinc-900 border-zinc-700 text-sm"
          />
        </div>
      ) : null}

      {onCaptionChange ? (
        <div className="space-y-1.5">
          <Label className="text-zinc-400 text-xs">Caption (optional)</Label>
          <Input
            value={caption ?? ""}
            onChange={(e) => onCaptionChange(e.target.value)}
            disabled={disabled || uploading}
            className="bg-zinc-900 border-zinc-700 text-sm"
          />
        </div>
      ) : null}

      {error ? (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

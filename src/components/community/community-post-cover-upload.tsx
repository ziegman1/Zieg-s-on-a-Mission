"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { CommunityPostCoverImage } from "./community-post-cover-image";
import { COMMUNITY_COVER_MAX_BYTES } from "@/lib/community/media-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const DEFAULT_UPLOAD_ENDPOINT = "/api/community/upload-cover";

export function CommunityPostCoverUpload({
  value,
  onChange,
  label = "Cover photo",
  variant = "light",
  compact = false,
  showUrlField = false,
  uploadEndpoint = DEFAULT_UPLOAD_ENDPOINT,
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  variant?: "light" | "dark";
  /** Social composer: inline photo button + compact preview */
  compact?: boolean;
  /** Show manual URL field (advanced options) */
  showUrlField?: boolean;
  uploadEndpoint?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlExpanded, setUrlExpanded] = useState(false);

  const isLight = variant === "light";
  const fieldClass = isLight
    ? "bg-white border-brand-primary/20 text-brand-ink focus-visible:ring-brand-primary/30"
    : "bg-zinc-800 border-zinc-600 text-cream";

  async function handleFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(uploadEndpoint, { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      if (!data.url) throw new Error("No URL returned");
      onChange(data.url);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
  }

  function clearCover() {
    onChange("");
    setUploadError(null);
  }

  const maxMb = Math.round(COMMUNITY_COVER_MAX_BYTES / (1024 * 1024));

  if (compact) {
    return (
      <div className={cn("space-y-2", className)}>
        {value ? (
          <CommunityPostCoverImage
            src={value}
            alt="Attached"
            variant="composer"
            className="border-brand-primary/15 bg-brand-surface/50"
          >
            <button
              type="button"
              onClick={clearCover}
              className="absolute top-2 right-2 rounded-full bg-black/55 text-white p-1.5 hover:bg-black/70 transition-colors"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          </CommunityPostCoverImage>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors border",
              isLight
                ? "border-brand-primary/20 bg-white text-brand-ink/75 hover:bg-brand-surface/80 hover:text-brand-primary"
                : "border-zinc-600 bg-zinc-800 text-zinc-300",
              uploading && "opacity-60",
            )}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-brand-primary" aria-hidden />
            ) : (
              <ImagePlus className="h-4 w-4 text-brand-primary" aria-hidden />
            )}
            {uploading ? "Uploading…" : value ? "Change photo" : "Add photo"}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={onInputChange}
          disabled={uploading}
        />

        {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}

        {showUrlField ? (
          <div className="space-y-1.5 pt-1">
            <Label className={cn("text-xs", isLight ? "text-brand-ink/70" : "text-zinc-300")}>
              {label}
            </Label>
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={fieldClass}
              placeholder="https://…"
              type="url"
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className={cn("text-xs", isLight ? "text-brand-ink/70" : "text-zinc-300")}>
        {label}
      </Label>

      {value ? (
        <CommunityPostCoverImage
          src={value}
          alt="Cover preview"
          variant="composer"
          className="border-brand-primary/15 bg-brand-surface/50"
        >
          <button
            type="button"
            onClick={clearCover}
            className="absolute top-2 right-2 rounded-full bg-black/55 text-white p-1.5 hover:bg-black/70 transition-colors"
            aria-label="Remove cover image"
          >
            <X className="h-4 w-4" />
          </button>
        </CommunityPostCoverImage>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 px-4 transition-colors",
            isLight
              ? "border-brand-primary/25 bg-white/80 hover:border-brand-primary/45 hover:bg-white"
              : "border-zinc-600 bg-zinc-800/50 hover:border-zinc-500",
            uploading && "opacity-70 pointer-events-none",
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" aria-hidden />
              <span className={cn("text-sm font-medium", isLight ? "text-brand-ink/70" : "text-zinc-400")}>
                Uploading…
              </span>
            </>
          ) : (
            <>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                <ImagePlus className="h-6 w-6" aria-hidden />
              </span>
              <span className={cn("text-sm font-medium", isLight ? "text-brand-ink" : "text-cream")}>
                Add cover photo
              </span>
              <span className={cn("text-xs", isLight ? "text-brand-ink/50" : "text-zinc-500")}>
                JPG, PNG, or WebP · max {maxMb} MB
              </span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={onInputChange}
        disabled={uploading}
      />

      {value && !uploading ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "text-xs font-medium text-brand-primary hover:underline",
            isLight ? "" : "text-brand-accent",
          )}
        >
          Replace photo
        </button>
      ) : null}

      {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}

      {showUrlField ? (
        <div className="space-y-1.5">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={fieldClass}
            placeholder="https://…"
            type="url"
          />
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setUrlExpanded((v) => !v)}
            className={cn(
              "text-xs hover:underline",
              isLight ? "text-brand-ink/50" : "text-zinc-500",
            )}
          >
            {urlExpanded ? "Hide URL field" : "Or paste image URL"}
          </button>
          {urlExpanded ? (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={fieldClass}
              placeholder="https://…"
              type="url"
            />
          ) : null}
        </>
      )}
    </div>
  );
}

"use client";

import { useCallback, useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import {
  NEWSLETTER_PDF_ACCEPT,
  uploadNewsletterDocumentFile,
} from "@/lib/newsletter/document-upload";
import {
  needsPdfUploadBeforeUse,
  pdfLinkDisplayName,
  validateNewsletterPdfLinkUrl,
} from "@/lib/newsletter/pdf-link-url";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function NewsletterPdfLinkField({
  url,
  onUrlChange,
  newsletterId,
  disabled = false,
  variant = "full",
  urlLabel = "URL",
  urlPlaceholder = "https://…",
  helpText,
  showUrlInput = true,
  testId = "newsletter-pdf-link",
}: {
  url: string;
  onUrlChange: (url: string) => void;
  newsletterId?: string;
  disabled?: boolean;
  variant?: "full" | "compact";
  urlLabel?: string;
  urlPlaceholder?: string;
  helpText?: string;
  showUrlInput?: boolean;
  testId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadRequired = Boolean(url.trim()) && needsPdfUploadBeforeUse(url);
  const hasHostedPdf = Boolean(url.trim()) && !uploadRequired;

  const validatePastedUrl = useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError(null);
      return;
    }
    setError(validateNewsletterPdfLinkUrl(trimmed));
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const { url: hosted } = await uploadNewsletterDocumentFile(file, { newsletterId });
        onUrlChange(hosted);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [newsletterId, onUrlChange],
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

  const compact = variant === "compact";
  const dropPadding = compact ? "py-4" : "py-6";

  return (
    <div className="space-y-2" data-testid={testId}>
      {helpText ? (
        <p className="text-[10px] text-zinc-500 leading-relaxed">{helpText}</p>
      ) : null}

      {hasHostedPdf ? (
        <div className="flex items-start gap-2 rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2">
          <FileText className="h-5 w-5 shrink-0 text-brand-primary mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-300 font-medium truncate">
              {pdfLinkDisplayName(url)}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono truncate">{url}</p>
          </div>
          {!disabled ? (
            <div className="flex shrink-0 gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-7 text-xs bg-zinc-800"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                Replace PDF
              </Button>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-7 w-7 bg-zinc-800 text-red-400"
                disabled={uploading}
                onClick={() => {
                  onUrlChange("");
                  setError(null);
                }}
                aria-label="Remove PDF"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {uploadRequired ? (
        <div
          className="rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 flex flex-wrap items-center gap-2"
          role="alert"
        >
          <p className="text-xs text-amber-400/95 flex-1 min-w-[12rem]">
            Upload this PDF before using it as a button link.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-7 text-xs shrink-0"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5 mr-1" />
            Upload PDF
          </Button>
        </div>
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
          accept={NEWSLETTER_PDF_ACCEPT}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={onFileInput}
        />
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-2 px-4 text-center",
            dropPadding,
          )}
        >
          {uploading ? (
            <Loader2 className="h-7 w-7 text-brand-primary animate-spin" aria-hidden />
          ) : (
            <FileText className={cn("text-zinc-600", compact ? "h-6 w-6" : "h-8 w-8")} aria-hidden />
          )}
          <p className="text-xs text-zinc-400">
            {uploading ? "Uploading…" : "Drag and drop a PDF, or"}
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
            Upload PDF
          </Button>
          <p className="text-[10px] text-zinc-500">PDF only · max 20 MB</p>
        </div>
      </div>

      {showUrlInput ? (
        <div className="space-y-1.5">
          <Label className="text-zinc-500 text-[10px]">{urlLabel}</Label>
          <Input
            value={url}
            onChange={(e) => {
              const value = e.target.value;
              onUrlChange(value);
              validatePastedUrl(value);
            }}
            onBlur={(e) => validatePastedUrl(e.target.value)}
            placeholder={urlPlaceholder}
            disabled={disabled || uploading}
            className="bg-zinc-900 border-zinc-700 text-xs font-mono"
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

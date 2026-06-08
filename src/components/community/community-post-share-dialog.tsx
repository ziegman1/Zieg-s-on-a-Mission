"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Check, Copy, Download, ExternalLink, Loader2, Share2 } from "lucide-react";
import { enableCommunityPostFacebookShareAction } from "@/app/admin/community/post-share-actions";
import type { PostShareAssets, PublicSharePreview } from "@/lib/community/post-public-share";
import { downloadShareImages } from "@/lib/community/download-share-images";
import { CommunityPostCoverImage } from "@/components/community/community-post-cover-image";
import { formatCommunityPostDate } from "@/lib/community/format-post-date";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SharePayload = {
  shareUrl: string;
  facebookShareUrl: string;
  assets: PostShareAssets;
  preview: PublicSharePreview;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function CommunityPostShareDialog({
  postId,
  open,
  onOpenChange,
}: {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [payload, setPayload] = useState<SharePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"post" | "link" | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [pending, startTransition] = useTransition();

  const loadShare = useCallback(() => {
    setError(null);
    setPayload(null);
    startTransition(async () => {
      const result = await enableCommunityPostFacebookShareAction(postId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPayload({
        shareUrl: result.shareUrl,
        facebookShareUrl: result.facebookShareUrl,
        assets: result.assets,
        preview: result.preview,
      });
    });
  }, [postId]);

  useEffect(() => {
    if (open) {
      setCopied(null);
      loadShare();
    } else {
      setPayload(null);
      setError(null);
      setCopied(null);
      setDownloading(false);
    }
  }, [open, loadShare]);

  function handleCopy(kind: "post" | "link", text: string) {
    void copyText(text).then((ok) => {
      if (ok) {
        setCopied(kind);
        window.setTimeout(() => setCopied(null), 2000);
      }
    });
  }

  function handleOpenFacebook() {
    if (!payload) return;
    window.open(payload.facebookShareUrl, "_blank", "noopener,noreferrer");
  }

  async function handleDownloadImages() {
    if (!payload?.assets.images.length) return;
    setDownloading(true);
    try {
      await downloadShareImages(payload.assets.images);
    } finally {
      setDownloading(false);
    }
  }

  const preview = payload?.preview;
  const assets = payload?.assets;
  const dateLabel = preview ? formatCommunityPostDate(preview.publishedAt) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[min(90dvh,720px)] overflow-y-auto gap-0 p-0">
        <div className="border-b border-black/[0.06] px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-brand-ink">
            <Share2 className="h-4 w-4 text-brand-primary" aria-hidden />
            Share to Facebook
          </DialogTitle>
          <p className="mt-1 text-xs text-brand-ink/55 leading-relaxed">
            Copy the post text, download images, and open Facebook&apos;s share dialog. Mission Hub
            promotion lives on the public share page — not in the caption.
          </p>
        </div>

        <div className="px-5 py-4 space-y-4">
          {pending && !payload && !error ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-brand-ink/55">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Preparing share…
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {preview && payload && assets ? (
            <>
              <div className="rounded-xl border border-black/[0.06] overflow-hidden bg-brand-surface/30">
                {preview.coverImageUrl ? (
                  <CommunityPostCoverImage src={preview.coverImageUrl} alt="" />
                ) : null}
                <div className="px-4 py-3 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink/40">
                    {preview.spaceTitle}
                    {dateLabel ? ` · ${dateLabel}` : ""}
                  </p>
                  <p className="text-sm font-semibold text-brand-ink leading-snug">{preview.title}</p>
                  <p className="text-xs text-brand-ink/60 line-clamp-4 leading-relaxed">
                    {preview.excerpt}
                  </p>
                  {!preview.usesHubSharePage ? (
                    <p className="text-[10px] text-brand-primary/80 pt-1">
                      Facebook will link to the public blog/newsletter page.
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink/40 mb-1.5">
                  Facebook post
                </p>
                <textarea
                  readOnly
                  value={assets.caption}
                  rows={8}
                  className={cn(
                    "w-full rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2.5",
                    "text-xs text-brand-ink/75 leading-relaxed resize-none",
                  )}
                />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink/40 mb-1.5">
                  Public share URL
                </p>
                <p className="text-xs text-brand-ink/65 break-all rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2">
                  {payload.shareUrl}
                </p>
              </div>

              {assets.images.length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink/40 mb-1.5">
                    Share images ({assets.images.length})
                  </p>
                  <ul className="space-y-1 text-[11px] text-brand-ink/55">
                    {assets.images.map((image) => (
                      <li key={image.url} className="truncate">
                        {image.filename}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleCopy("post", assets.caption)}
                >
                  {copied === "post" ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Copy Facebook Post
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleCopy("link", payload.shareUrl)}
                >
                  {copied === "link" ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Copy link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={assets.images.length === 0 || downloading}
                  onClick={() => void handleDownloadImages()}
                >
                  {downloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Download className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Download Share Images
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                  onClick={handleOpenFacebook}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Open Facebook
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

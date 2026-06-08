"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, Loader2, Users } from "lucide-react";
import { CommunityPostSharePreviewCard } from "@/components/community/community-post-share-preview-card";
import {
  copyShareText,
  useCommunityPostShare,
} from "@/components/community/use-community-post-share";
import { downloadShareImages } from "@/lib/community/download-share-images";
import { FACEBOOK_GROUP_SHARE_INSTRUCTIONS } from "@/lib/community/post-public-share";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function CommunityPostFacebookGroupShareDialog({
  postId,
  open,
  onOpenChange,
}: {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { payload, error, pending } = useCommunityPostShare(postId, open);
  const [copied, setCopied] = useState<"caption" | "link" | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!open) {
      setCopied(null);
      setDownloading(false);
    }
  }, [open]);

  function handleCopy(kind: "caption" | "link", text: string) {
    void copyShareText(text).then((ok) => {
      if (ok) {
        setCopied(kind);
        window.setTimeout(() => setCopied(null), 2000);
      }
    });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[min(90dvh,720px)] overflow-y-auto gap-0 p-0">
        <div className="border-b border-black/[0.06] px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-brand-ink">
            <Users className="h-4 w-4 text-brand-primary" aria-hidden />
            Share to Facebook Group
          </DialogTitle>
          <p className="mt-1 text-xs text-brand-ink/55 leading-relaxed">
            Facebook groups don&apos;t reliably pull images from share links. Use this manual
            workflow so your update includes the photos.
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
              <div className="rounded-xl border border-brand-primary/15 bg-brand-primary/[0.04] px-4 py-3">
                <p className="text-xs text-brand-ink/75 leading-relaxed">
                  {FACEBOOK_GROUP_SHARE_INSTRUCTIONS}
                </p>
              </div>

              <CommunityPostSharePreviewCard preview={preview} />

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink/40 mb-1.5">
                  Caption
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
                  Public share link
                </p>
                <p className="text-xs text-brand-ink/65 break-all rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2">
                  {payload.shareUrl}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink/40 mb-1.5">
                  Post images
                </p>
                {assets.images.length > 0 ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {assets.images.map((image, index) => (
                        <div
                          key={image.url}
                          className="overflow-hidden rounded-lg border border-black/[0.06] bg-brand-surface/40"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={image.url}
                            alt={index === 0 ? "Featured image" : `Gallery image ${index}`}
                            className="aspect-[4/3] w-full object-cover"
                          />
                          <p className="truncate px-2 py-1 text-[10px] text-brand-ink/50">
                            {index === 0 ? "Featured" : `Gallery ${index}`} · {image.filename}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-brand-ink/55 rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2.5">
                    No images are attached to this update.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleCopy("caption", assets.caption)}
                >
                  {copied === "caption" ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Copy Caption
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
                  Copy Link
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
                  Download Images
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

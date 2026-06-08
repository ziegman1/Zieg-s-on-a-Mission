"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, ExternalLink, Loader2, Users } from "lucide-react";
import {
  copyShareText,
  useCommunityPostShare,
} from "@/components/community/use-community-post-share";
import {
  canCopyShareImagesToClipboard,
  copyShareImageToClipboard,
  downloadShareImage,
  downloadShareImages,
} from "@/lib/community/download-share-images";
import { FACEBOOK_GROUP_SHARE_INSTRUCTIONS } from "@/lib/community/post-public-share";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const facebookGroupUrl = process.env.NEXT_PUBLIC_FACEBOOK_GROUP_URL?.trim() ?? "";

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
  const [copiedPost, setCopiedPost] = useState(false);
  const [copiedImageUrl, setCopiedImageUrl] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingImageUrl, setDownloadingImageUrl] = useState<string | null>(null);
  const canCopyImages = canCopyShareImagesToClipboard();

  useEffect(() => {
    if (!open) {
      setCopiedPost(false);
      setCopiedImageUrl(null);
      setDownloadingAll(false);
      setDownloadingImageUrl(null);
    }
  }, [open]);

  function handleCopyFacebookPost(text: string) {
    void copyShareText(text).then((ok) => {
      if (ok) {
        setCopiedPost(true);
        window.setTimeout(() => setCopiedPost(false), 2000);
      }
    });
  }

  async function handleDownloadAllImages() {
    if (!payload?.assets.images.length) return;
    setDownloadingAll(true);
    try {
      await downloadShareImages(payload.assets.images);
    } finally {
      setDownloadingAll(false);
    }
  }

  async function handleDownloadImage(imageUrl: string) {
    const image = payload?.assets.images.find((item) => item.url === imageUrl);
    if (!image) return;
    setDownloadingImageUrl(imageUrl);
    try {
      await downloadShareImage(image);
    } finally {
      setDownloadingImageUrl(null);
    }
  }

  function handleCopyImage(imageUrl: string) {
    const image = payload?.assets.images.find((item) => item.url === imageUrl);
    if (!image) return;
    void copyShareImageToClipboard(image).then((ok) => {
      if (ok) {
        setCopiedImageUrl(imageUrl);
        window.setTimeout(() => setCopiedImageUrl(null), 2000);
      }
    });
  }

  function handleOpenFacebookGroup() {
    if (!facebookGroupUrl) return;
    window.open(facebookGroupUrl, "_blank", "noopener,noreferrer");
  }

  const assets = payload?.assets;
  const showGroupSetupWarning =
    process.env.NODE_ENV === "development" && !facebookGroupUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[min(90dvh,720px)] overflow-y-auto gap-0 p-0">
        <div className="border-b border-black/[0.06] px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-brand-ink">
            <Users className="h-4 w-4 text-brand-primary" aria-hidden />
            Share to Facebook Group
          </DialogTitle>
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

          {payload && assets ? (
            <>
              <div className="rounded-xl border border-brand-primary/15 bg-brand-primary/[0.04] px-4 py-3">
                <p className="text-xs text-brand-ink/75 leading-relaxed">
                  {FACEBOOK_GROUP_SHARE_INSTRUCTIONS}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink/40 mb-1.5">
                  Facebook Post
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
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleCopyFacebookPost(assets.caption)}
                  >
                    {copiedPost ? (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Copy Facebook Post
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink/40">
                    Post images
                  </p>
                  {assets.images.length > 0 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-7 text-xs"
                      disabled={downloadingAll}
                      onClick={() => void handleDownloadAllImages()}
                    >
                      {downloadingAll ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Download className="h-3.5 w-3.5" aria-hidden />
                      )}
                      Download Images
                    </Button>
                  ) : null}
                </div>

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
                          <div className="space-y-1 px-2 py-2">
                            <p className="truncate text-[10px] text-brand-ink/50">
                              {index === 0 ? "Featured" : `Gallery ${index}`} · {image.filename}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 px-2 text-[10px]"
                                disabled={downloadingImageUrl === image.url}
                                onClick={() => void handleDownloadImage(image.url)}
                              >
                                {downloadingImageUrl === image.url ? (
                                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                                ) : (
                                  <Download className="h-3 w-3" aria-hidden />
                                )}
                                Download
                              </Button>
                              {canCopyImages ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 gap-1 px-2 text-[10px]"
                                  onClick={() => handleCopyImage(image.url)}
                                >
                                  {copiedImageUrl === image.url ? (
                                    <Check className="h-3 w-3" aria-hidden />
                                  ) : (
                                    <Copy className="h-3 w-3" aria-hidden />
                                  )}
                                  Copy Image
                                </Button>
                              ) : null}
                            </div>
                          </div>
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

              {showGroupSetupWarning ? (
                <p className="text-xs text-amber-800 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                  Set <code className="text-[11px]">NEXT_PUBLIC_FACEBOOK_GROUP_URL</code> to enable
                  Open Facebook Group.
                </p>
              ) : null}

              {facebookGroupUrl ? (
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                  onClick={handleOpenFacebookGroup}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Open Facebook Group
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

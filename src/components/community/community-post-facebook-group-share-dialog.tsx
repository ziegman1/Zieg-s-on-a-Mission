"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, ExternalLink, Loader2, Users } from "lucide-react";
import {
  copyShareText,
  useCommunityPostShare,
} from "@/components/community/use-community-post-share";
import { downloadShareImage, downloadShareImages } from "@/lib/community/download-share-images";
import { FACEBOOK_GROUP_SHARE_INSTRUCTIONS } from "@/lib/community/post-public-share";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const facebookGroupUrl = process.env.NEXT_PUBLIC_FACEBOOK_GROUP_URL?.trim() ?? "";

function StepHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-[10px] font-bold text-brand-primary">
        {step}
      </span>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink/50">{title}</p>
    </div>
  );
}

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
  const [captionCopied, setCaptionCopied] = useState(false);
  const [captionCopyFailed, setCaptionCopyFailed] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [savingImageUrl, setSavingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCaptionCopied(false);
      setCaptionCopyFailed(false);
      setSavingAll(false);
      setSavingImageUrl(null);
    }
  }, [open]);

  function handleCopyCaption(text: string) {
    setCaptionCopyFailed(false);
    setCaptionCopied(false);
    void copyShareText(text).then((ok) => {
      if (ok) {
        setCaptionCopied(true);
        window.setTimeout(() => setCaptionCopied(false), 2500);
        return;
      }
      setCaptionCopyFailed(true);
    });
  }

  async function handleSaveAllImages() {
    if (!payload?.assets.images.length) return;
    setSavingAll(true);
    try {
      await downloadShareImages(payload.assets.images);
    } finally {
      setSavingAll(false);
    }
  }

  async function handleSaveImage(imageUrl: string) {
    const image = payload?.assets.images.find((item) => item.url === imageUrl);
    if (!image) return;
    setSavingImageUrl(imageUrl);
    try {
      await downloadShareImage(image);
    } finally {
      setSavingImageUrl(null);
    }
  }

  function handleOpenFacebookGroup() {
    if (!facebookGroupUrl) return;
    window.open(facebookGroupUrl, "_blank", "noopener,noreferrer");
  }

  const assets = payload?.assets;
  const hasMultipleImages = (assets?.images.length ?? 0) > 1;
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

        <div className="px-5 py-4 space-y-5">
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

              <section className="space-y-2.5">
                <StepHeading step={1} title="Copy Caption" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleCopyCaption(assets.caption)}
                >
                  {captionCopied ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Copy Caption
                </Button>
                {captionCopied ? (
                  <p
                    role="status"
                    aria-live="polite"
                    className="text-xs text-emerald-800 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2"
                  >
                    Caption copied.
                  </p>
                ) : null}
                {captionCopyFailed ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-amber-800">
                      Copy failed — select and copy the caption manually.
                    </p>
                    <textarea
                      readOnly={false}
                      defaultValue={assets.caption}
                      rows={8}
                      className={cn(
                        "w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5",
                        "text-xs text-brand-ink/75 leading-relaxed resize-none select-text",
                      )}
                      onFocus={(event) => event.currentTarget.select()}
                    />
                  </div>
                ) : null}
              </section>

              <section className="space-y-2.5">
                <StepHeading step={2} title="Save Image" />

                {assets.images.length > 0 ? (
                  <div className="space-y-3">
                    {hasMultipleImages ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={savingAll}
                        onClick={() => void handleSaveAllImages()}
                      >
                        {savingAll ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Download className="h-3.5 w-3.5" aria-hidden />
                        )}
                        Save All Images
                      </Button>
                    ) : null}

                    <div className={cn("grid gap-2", hasMultipleImages ? "grid-cols-2" : "grid-cols-1")}>
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
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 gap-1 px-2 text-[10px]"
                              disabled={savingImageUrl === image.url}
                              onClick={() => void handleSaveImage(image.url)}
                            >
                              {savingImageUrl === image.url ? (
                                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                              ) : (
                                <Download className="h-3 w-3" aria-hidden />
                              )}
                              Save Image
                            </Button>
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
              </section>

              <section className="space-y-2.5">
                <StepHeading step={3} title="Open Facebook Group" />
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
                ) : showGroupSetupWarning ? (
                  <p className="text-xs text-amber-800 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                    Set <code className="text-[11px]">NEXT_PUBLIC_FACEBOOK_GROUP_URL</code> to enable
                    Open Facebook Group.
                  </p>
                ) : null}
              </section>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

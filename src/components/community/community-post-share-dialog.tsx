"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, Share2 } from "lucide-react";
import { CommunityPostSharePreviewCard } from "@/components/community/community-post-share-preview-card";
import {
  copyShareText,
  useCommunityPostShare,
} from "@/components/community/use-community-post-share";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function CommunityPostShareDialog({
  postId,
  open,
  onOpenChange,
}: {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { payload, error, pending } = useCommunityPostShare(postId, open);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (!open) setCopiedLink(false);
  }, [open]);

  function handleOpenFacebook() {
    if (!payload) return;
    window.open(payload.facebookShareUrl, "_blank", "noopener,noreferrer");
  }

  function handleCopyLink() {
    if (!payload) return;
    void copyShareText(payload.shareUrl).then((ok) => {
      if (ok) {
        setCopiedLink(true);
        window.setTimeout(() => setCopiedLink(false), 2000);
      }
    });
  }

  const preview = payload?.preview;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[min(90dvh,720px)] overflow-y-auto gap-0 p-0">
        <div className="border-b border-black/[0.06] px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-brand-ink">
            <Share2 className="h-4 w-4 text-brand-primary" aria-hidden />
            Share to Facebook
          </DialogTitle>
          <p className="mt-1 text-xs text-brand-ink/55 leading-relaxed">
            Share to your personal Facebook timeline using Facebook&apos;s link preview. For groups,
            use &quot;Share to Facebook Group&quot; instead.
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

          {preview && payload ? (
            <>
              <CommunityPostSharePreviewCard
                preview={preview}
                hubShareNote={
                  !preview.usesHubSharePage
                    ? "Facebook will link to the public blog/newsletter page."
                    : null
                }
              />

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink/40 mb-1.5">
                  Public share link
                </p>
                <p className="text-xs text-brand-ink/65 break-all rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2">
                  {payload.shareUrl}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  className="gap-1.5 bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                  onClick={handleOpenFacebook}
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  Open Facebook
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleCopyLink}
                >
                  {copiedLink ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Copy Link
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

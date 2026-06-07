"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Check, Copy, ExternalLink, Loader2, Share2 } from "lucide-react";
import { enableCommunityPostFacebookShareAction } from "@/app/admin/community/post-share-actions";
import type { PublicSharePreview } from "@/lib/community/post-public-share";
import { CommunityPostCoverImage } from "@/components/community/community-post-cover-image";
import { formatCommunityPostDate } from "@/lib/community/format-post-date";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type SharePayload = {
  shareUrl: string;
  facebookShareUrl: string;
  suggestedCaption: string;
  preview: PublicSharePreview;
  missionHubJoinUrl: string;
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
  const [copied, setCopied] = useState<"caption" | "link" | null>(null);
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
        suggestedCaption: result.suggestedCaption,
        preview: result.preview,
        missionHubJoinUrl: result.missionHubJoinUrl,
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
    }
  }, [open, loadShare]);

  function handleCopy(kind: "caption" | "link", text: string) {
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

  const preview = payload?.preview;
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
            Share this update and invite friends to join Mission Hub — our home beyond social
            media algorithms.
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
              <div className="rounded-xl border border-black/[0.06] overflow-hidden bg-brand-surface/30">
                {preview.coverImageUrl ? (
                  <div className="aspect-[1.91/1] w-full bg-brand-surface/50">
                    <CommunityPostCoverImage
                      src={preview.coverImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="px-4 py-3 space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink/40">
                    {preview.spaceTitle}
                    {dateLabel ? ` · ${dateLabel}` : ""}
                  </p>
                  <p className="text-sm font-semibold text-brand-ink leading-snug">
                    {preview.title}
                  </p>
                  <p className="text-xs text-brand-ink/60 line-clamp-4 leading-relaxed">
                    {preview.excerpt}
                  </p>
                  {!preview.usesHubSharePage ? (
                    <p className="text-[10px] text-brand-primary/80 pt-1">
                      Facebook will link to the public blog/newsletter page. Mission Hub invitation
                      is included in the caption below.
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink/40 mb-1.5">
                  Suggested caption
                </p>
                <textarea
                  readOnly
                  value={payload.suggestedCaption}
                  rows={10}
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

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-ink/40 mb-1.5">
                  Mission Hub join URL
                </p>
                <p className="text-xs text-brand-ink/65 break-all rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2">
                  {payload.missionHubJoinUrl}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleCopy("caption", payload.suggestedCaption)}
                >
                  {copied === "caption" ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Copy caption
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

"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Mail, Share2, Smartphone } from "lucide-react";
import { buildFacebookShareUrl } from "@/lib/share/share-content";
import { cn } from "@/lib/utils";

export type ShareContentPanelProps = {
  heading?: string;
  /** Email subject line */
  title: string;
  /** Absolute URL copied and used for Facebook sharing */
  shareUrl: string;
  /** Full message body for SMS and email */
  shareMessage: string;
  variant?: "storefront" | "admin";
  className?: string;
};

export function ShareContentPanel({
  heading = "Share This Update",
  title,
  shareUrl,
  shareMessage,
  variant = "storefront",
  className,
}: ShareContentPanelProps) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const facebookShareUrl = useMemo(() => buildFacebookShareUrl(shareUrl), [shareUrl]);
  const isAdmin = variant === "admin";

  async function handleCopyLink() {
    setShareError(null);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setShareError("Could not copy. Select the link below and copy manually.");
    }
  }

  function handleSendText() {
    setShareError(null);
    window.location.href = `sms:?&body=${encodeURIComponent(shareMessage)}`;
  }

  function handleSendEmail() {
    setShareError(null);
    const subject = encodeURIComponent(title.trim() || "Ministry update");
    const body = encodeURIComponent(shareMessage);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  function handleShareFacebook() {
    setShareError(null);
    window.open(facebookShareUrl, "_blank", "noopener,noreferrer");
  }

  const actionClass = cn(
    "flex flex-col items-center justify-center gap-1.5 rounded-xl min-h-[4.25rem] px-2 py-2.5",
    "text-[11px] font-semibold transition-[transform,background-color] duration-75 touch-manipulation",
    "active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2",
    isAdmin
      ? cn(
          "text-zinc-300 bg-zinc-900/80 border border-zinc-700",
          "hover:bg-zinc-800 hover:border-zinc-600 hover:text-zinc-100",
          "focus-visible:ring-zinc-500/40",
        )
      : cn(
          "text-brand-ink/70 bg-white/90 border border-black/[0.05]",
          "shadow-[0_1px_3px_rgba(30,54,68,0.04)]",
          "hover:bg-white hover:border-brand-primary/15 hover:text-brand-ink",
          "focus-visible:ring-brand-primary/35",
        ),
  );

  return (
    <section
      className={cn(
        "rounded-xl border",
        isAdmin
          ? "border-zinc-800 bg-zinc-900/40 p-4"
          : "border-brand-primary/15 bg-brand-primary/[0.04] px-5 py-6 sm:px-7 sm:py-7",
        className,
      )}
      aria-labelledby="share-content-panel-heading"
      data-testid="share-content-panel"
    >
      <div className="flex items-start gap-2 mb-4">
        <Share2
          className={cn("h-4 w-4 shrink-0 mt-0.5", isAdmin ? "text-zinc-400" : "text-brand-primary")}
          aria-hidden
        />
        <div>
          <h2
            id="share-content-panel-heading"
            className={cn(
              "text-sm font-semibold",
              isAdmin ? "text-zinc-200" : "font-serif text-lg text-brand-ink tracking-wide",
            )}
          >
            {heading}
          </h2>
          <p
            className={cn(
              "mt-1 text-xs leading-relaxed",
              isAdmin ? "text-zinc-500" : "text-brand-ink/65",
            )}
          >
            Copy the link or open your messaging apps to share this update with someone directly.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button type="button" onClick={() => void handleCopyLink()} className={actionClass}>
          {copied ? (
            <Check className={cn("h-5 w-5", isAdmin ? "text-emerald-400" : "text-brand-primary/80")} aria-hidden />
          ) : (
            <Copy className={cn("h-5 w-5", isAdmin ? "text-zinc-400" : "text-brand-primary/80")} aria-hidden />
          )}
          {copied ? "Copied" : "Copy Link"}
        </button>
        <button type="button" onClick={handleSendText} className={actionClass}>
          <Smartphone className={cn("h-5 w-5", isAdmin ? "text-zinc-400" : "text-brand-primary/80")} aria-hidden />
          Send Text
        </button>
        <button type="button" onClick={handleSendEmail} className={actionClass}>
          <Mail className={cn("h-5 w-5", isAdmin ? "text-zinc-400" : "text-brand-primary/80")} aria-hidden />
          Send Email
        </button>
        <button type="button" onClick={handleShareFacebook} className={actionClass}>
          <ExternalLink className={cn("h-5 w-5", isAdmin ? "text-zinc-400" : "text-brand-primary/80")} aria-hidden />
          Share on Facebook
        </button>
      </div>

      <div className="mt-4 space-y-1.5">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wider",
            isAdmin ? "text-zinc-500" : "text-brand-ink/40",
          )}
        >
          Share link
        </p>
        <p
          className={cn(
            "break-all text-xs leading-relaxed rounded-lg px-3 py-2.5",
            isAdmin
              ? "text-zinc-400 bg-zinc-950/60 border border-zinc-800"
              : "text-brand-ink/55 bg-black/[0.02] border border-black/[0.04]",
          )}
        >
          {shareUrl}
        </p>
      </div>

      {shareError ? (
        <p className={cn("mt-3 text-xs", isAdmin ? "text-red-400" : "text-red-600")}>{shareError}</p>
      ) : null}
    </section>
  );
}

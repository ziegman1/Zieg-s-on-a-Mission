"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  Copy,
  Mail,
  MessageSquare,
  QrCode,
  Share2,
  Smartphone,
} from "lucide-react";
import {
  buildInviteJoinUrl,
  buildInviteShareText,
  resolveInviteContext,
} from "@/lib/community/invite";
import { CommunityBottomSheet } from "./community-bottom-sheet";
import { cn } from "@/lib/utils";

function canNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function CommunityInviteSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const context = useMemo(() => resolveInviteContext(pathname), [pathname]);

  const inviteUrl = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : undefined;
    return buildInviteJoinUrl(origin ?? "", context.targetPath);
  }, [context.targetPath, pathname]);

  const shareText = useMemo(
    () => buildInviteShareText(context.message, inviteUrl),
    [context.message, inviteUrl],
  );

  const resetTransient = useCallback(() => {
    setCopied(false);
    setShowQr(false);
    setShareError(null);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resetTransient();
      onOpenChange(next);
    },
    [onOpenChange, resetTransient],
  );

  async function handleNativeShare() {
    setShareError(null);
    if (!canNativeShare()) return;
    try {
      await navigator.share({
        title: context.shareTitle,
        text: context.message,
        url: inviteUrl,
      });
      handleOpenChange(false);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setShareError("Could not open share sheet. Try copy link instead.");
    }
  }

  async function handleCopyLink() {
    setShareError(null);
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      setShareError("Could not copy. Select the link below and copy manually.");
    }
  }

  function handleSendText() {
    const body = encodeURIComponent(shareText);
    window.location.href = `sms:?&body=${body}`;
  }

  function handleSendEmail() {
    const subject = encodeURIComponent(context.shareTitle);
    const body = encodeURIComponent(shareText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  const actionClass = cn(
    "flex flex-col items-center justify-center gap-1.5 rounded-xl min-h-[4.25rem] px-2 py-2.5",
    "text-[11px] font-semibold text-brand-ink/70",
    "bg-white/90 border border-black/[0.05]",
    "shadow-[0_1px_3px_rgba(30,54,68,0.04)]",
    "transition-[transform,background-color] duration-75 touch-manipulation",
    "hover:bg-white hover:border-brand-primary/15 hover:text-brand-ink",
    "active:scale-[0.97] active:bg-black/[0.03]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/35",
  );

  const qrSrc =
    showQr && inviteUrl
      ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(inviteUrl)}`
      : null;

  return (
    <CommunityBottomSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="Invite"
      description={context.sheetDescription}
      className="max-h-[min(88dvh,640px)]"
    >
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-brand-ink/72 rounded-xl bg-brand-surface/60 border border-black/[0.04] px-3.5 py-3">
          {context.message}
        </p>

        {canNativeShare() ? (
          <button
            type="button"
            onClick={() => void handleNativeShare()}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-full min-h-[2.75rem] px-4",
              "text-sm font-semibold text-white bg-brand-primary",
              "shadow-[0_4px_14px_rgba(131,176,218,0.35)]",
              "transition-transform duration-75 touch-manipulation active:scale-[0.98]",
              "hover:bg-brand-primary/93",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 focus-visible:ring-offset-2",
            )}
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Share invite
          </button>
        ) : null}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button type="button" onClick={() => void handleCopyLink()} className={actionClass}>
            <Copy className="h-5 w-5 text-brand-primary/80" aria-hidden />
            {copied ? "Copied" : "Copy Link"}
          </button>
          <button type="button" onClick={handleSendText} className={actionClass}>
            <Smartphone className="h-5 w-5 text-brand-primary/80" aria-hidden />
            Send Text
          </button>
          <button type="button" onClick={handleSendEmail} className={actionClass}>
            <Mail className="h-5 w-5 text-brand-primary/80" aria-hidden />
            Send Email
          </button>
          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            className={cn(actionClass, showQr && "border-brand-primary/25 bg-brand-primary/8 text-brand-primary")}
            aria-expanded={showQr}
          >
            <QrCode className="h-5 w-5 text-brand-primary/80" aria-hidden />
            QR Code
          </button>
        </div>

        {showQr && qrSrc ? (
          <div
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border border-black/[0.05]",
              "bg-white px-4 py-4 animate-in fade-in zoom-in-95 duration-200",
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt="QR code for Mission Hub invite link"
              width={200}
              height={200}
              className="rounded-lg"
            />
            <p className="text-center text-xs text-brand-ink/50 max-w-[16rem]">
              Scan to join — new members sign up, then arrive at your invite destination.
            </p>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-ink/40">
            Invite link
          </p>
          <p className="break-all text-xs text-brand-ink/55 leading-relaxed rounded-lg bg-black/[0.02] border border-black/[0.04] px-3 py-2.5">
            {inviteUrl}
          </p>
          <p className="flex items-start gap-1.5 text-[11px] text-brand-ink/45 leading-snug">
            <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-60" aria-hidden />
            New guests join Mission Hub first, then land on the page you invited them to.
          </p>
        </div>

        {shareError ? <p className="text-xs text-red-600">{shareError}</p> : null}
      </div>
    </CommunityBottomSheet>
  );
}

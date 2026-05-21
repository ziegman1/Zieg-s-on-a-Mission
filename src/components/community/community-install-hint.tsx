"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Smartphone, X } from "lucide-react";
import {
  dismissInstallHint,
  getInstallHintInstructions,
  getInstallHintPlatform,
  isInstallHintDismissed,
  isMobileViewport,
  isStandaloneDisplayMode,
  type InstallHintPlatform,
} from "@/lib/community/install-hint";
import { MH } from "@/lib/community/hub-design";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Chromium beforeinstallprompt (not in lib DOM types) */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const AUTH_PATHS = new Set(["/community/login", "/community/join"]);

export function CommunityInstallHint({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<InstallHintPlatform>("ios");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installing, setInstalling] = useState(false);

  const evaluateVisibility = useCallback(() => {
    if (!signedIn) return false;
    if (AUTH_PATHS.has(pathname)) return false;
    if (isStandaloneDisplayMode()) return false;
    if (isInstallHintDismissed()) return false;

    const plat = getInstallHintPlatform();
    const hasNativePrompt = Boolean(deferredPrompt);

    if (plat === "desktop") {
      return hasNativePrompt;
    }

    return isMobileViewport() || hasNativePrompt;
  }, [signedIn, pathname, deferredPrompt]);

  useEffect(() => {
    setPlatform(getInstallHintPlatform());
    setVisible(evaluateVisibility());
  }, [evaluateVisibility]);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  useEffect(() => {
    setVisible(evaluateVisibility());
  }, [deferredPrompt, evaluateVisibility]);

  const handleDismiss = () => {
    dismissInstallHint();
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
      setInstalling(false);
      dismissInstallHint();
      setVisible(false);
    }
  };

  if (!visible) return null;

  const instructions = getInstallHintInstructions(platform);
  const showInstallButton = Boolean(deferredPrompt);

  return (
    <div
      className={cn(
        "mx-auto w-full px-3 sm:px-4 pt-3",
        MH.feedMax,
        "max-w-[76rem]",
      )}
      role="region"
      aria-label="Install Mission Hub"
    >
      <div
        className={cn(
          "flex gap-3 rounded-2xl border border-brand-primary/15 bg-white/95 px-3.5 py-3",
          "shadow-[0_1px_2px_rgba(28,42,68,0.05),0_4px_16px_rgba(28,42,68,0.06)]",
          MH.transition,
        )}
      >
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary/12 text-brand-primary"
          aria-hidden
        >
          <Smartphone className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-ink leading-snug">
            Add Mission Hub to your home screen
          </p>
          <p className="mt-0.5 text-xs text-brand-ink/65 leading-relaxed">{instructions}</p>
          {showInstallButton ? (
            <Button
              type="button"
              size="sm"
              className="mt-2.5 h-8 rounded-full bg-brand-primary hover:bg-brand-primary/90 text-xs px-4"
              disabled={installing}
              onClick={() => void handleInstall()}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" aria-hidden />
              {installing ? "Opening…" : "Install"}
            </Button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-brand-ink/40 hover:text-brand-ink/70 hover:bg-brand-surface/80 transition-colors"
          aria-label="Dismiss install hint"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

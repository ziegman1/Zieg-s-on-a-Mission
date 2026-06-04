"use client";

import { useEffect, type RefObject } from "react";

/** Stable DOM id for per-post comment inputs (sync focus from tap handler). */
export function missionHubCommentInputId(postId: string): string {
  return `mh-comment-input-${postId}`;
}

/**
 * Focus the comment textarea synchronously — must run inside pointerdown/click
 * while the user gesture is active (required for iOS keyboard).
 */
export function focusMissionHubCommentInput(postId: string): boolean {
  if (typeof document === "undefined") return false;
  const el = document.getElementById(
    missionHubCommentInputId(postId),
  ) as HTMLTextAreaElement | null;
  if (!el || el.disabled) return false;
  try {
    el.focus({ preventScroll: false });
    const len = el.value.length;
    el.setSelectionRange(len, len);
  } catch {
    el.focus();
  }
  return true;
}

/**
 * Focus a textarea/input on mobile with retries (fallback after mount).
 */
export function useMobileComposerFocus(
  enabled: boolean,
  inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
  /** Bump when the comment panel opens to re-run mobile focus. */
  focusKey = 0,
  /** When false, focus without scrolling the viewport (default for passive mounts). */
  scrollIntoViewOnFocus = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const focusInput = () => {
      const el = inputRef.current;
      if (!el || el.disabled) return false;
      try {
        el.focus({ preventScroll: !scrollIntoViewOnFocus });
        const len = el.value.length;
        el.setSelectionRange(len, len);
      } catch {
        el.focus();
      }
      if (scrollIntoViewOnFocus) {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      return true;
    };

    let cancelled = false;
    const attempts = [0, 16, 50, 120, 240];
    const timers: number[] = [];

    for (const delay of attempts) {
      const id = window.setTimeout(() => {
        if (cancelled) return;
        focusInput();
      }, delay);
      timers.push(id);
    }

    const raf = requestAnimationFrame(() => {
      if (!cancelled) focusInput();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      for (const id of timers) window.clearTimeout(id);
    };
  }, [enabled, focusKey, inputRef, scrollIntoViewOnFocus]);
}

"use client";

import { useEffect, type RefObject } from "react";

/**
 * Focus a textarea/input on mobile with retries (iOS often misses the first focus).
 */
export function useMobileComposerFocus(
  enabled: boolean,
  inputRef: RefObject<HTMLTextAreaElement | HTMLInputElement | null>,
  /** Bump when the composer opens so focus runs again. */
  focusKey = 0,
) {
  useEffect(() => {
    if (!enabled) return;

    const focusInput = () => {
      const el = inputRef.current;
      if (!el || el.disabled) return false;
      try {
        el.focus({ preventScroll: false });
        const len = el.value.length;
        el.setSelectionRange(len, len);
      } catch {
        el.focus();
      }
      el.scrollIntoView({ block: "center", behavior: "smooth" });
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
  }, [enabled, focusKey, inputRef]);
}

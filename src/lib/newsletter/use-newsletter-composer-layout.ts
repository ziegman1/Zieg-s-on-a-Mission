"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { NewsletterComposerLayoutMode } from "@/lib/newsletter/composer-layout";
import { perfMark } from "@/lib/newsletter/composer-perf";

const LAYOUT_URL_SYNC_MS = 300;

/**
 * Local layout mode for instant tab clicks; URL updates are debounced so router.replace
 * does not block the UI on every Edit/Split/Preview toggle.
 */
export function useNewsletterComposerLayout(
  urlMode: NewsletterComposerLayoutMode,
  syncUrl: (mode: NewsletterComposerLayoutMode) => void,
  resetKey: string,
): [NewsletterComposerLayoutMode, (mode: NewsletterComposerLayoutMode) => void] {
  const [layoutMode, setLayoutMode] = useState(urlMode);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLayoutMode(urlMode);
  }, [resetKey, urlMode]);

  const setLayoutModeAndSyncUrl = useCallback(
    (mode: NewsletterComposerLayoutMode) => {
      perfMark("layout-mode", mode);
      setLayoutMode(mode);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(() => {
        syncTimerRef.current = null;
        perfMark("layout-mode-url-sync", mode);
        syncUrl(mode);
      }, LAYOUT_URL_SYNC_MS);
    },
    [syncUrl],
  );

  useEffect(
    () => () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    },
    [],
  );

  return [layoutMode, setLayoutModeAndSyncUrl];
}

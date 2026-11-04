"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
  type ReactNode,
} from "react";
import type { AnalyticsConsentStatus } from "@/lib/analytics/consent";
import type { AnalyticsRegionMode } from "@/lib/analytics/geo";
import {
  isAnalyticsCollectionAllowed,
  setAnalyticsCollectionAllowed,
  subscribeAnalyticsPrivacy,
} from "@/lib/analytics/privacy-client";
import { clearClientSession } from "@/lib/analytics/session-id";

type PrivacyStatus = {
  regionMode: AnalyticsRegionMode;
  consent: AnalyticsConsentStatus;
  collectionAllowed: boolean;
  engagementEnabled: boolean;
};

type AnalyticsPrivacyContextValue = {
  ready: boolean;
  regionMode: AnalyticsRegionMode | null;
  consent: AnalyticsConsentStatus | null;
  collectionAllowed: boolean;
  showBanner: boolean;
  preferencesOpen: boolean;
  openPreferences: () => void;
  closePreferences: () => void;
  setConsentChoice: (choice: "granted" | "denied") => Promise<void>;
};

const AnalyticsPrivacyContext = createContext<AnalyticsPrivacyContextValue | null>(null);

export function useAnalyticsPrivacy(): AnalyticsPrivacyContextValue {
  const ctx = useContext(AnalyticsPrivacyContext);
  if (!ctx) {
    throw new Error("useAnalyticsPrivacy requires AnalyticsPrivacyProvider");
  }
  return ctx;
}

/** Safe hook when provider may be absent (e.g. isolated tests). */
export function useAnalyticsPrivacyOptional(): AnalyticsPrivacyContextValue | null {
  return useContext(AnalyticsPrivacyContext);
}

export function AnalyticsPrivacyProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<PrivacyStatus | null>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [collectionAllowed, setCollectionAllowedState] = useState(false);

  const applyStatus = useEffectEvent((next: PrivacyStatus) => {
    setStatus(next);
    setAnalyticsCollectionAllowed(next.collectionAllowed);
    setCollectionAllowedState(next.collectionAllowed);
    if (!next.collectionAllowed) clearClientSession();
    setReady(true);
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/analytics-privacy", { credentials: "same-origin" });
        const data = (await res.json()) as PrivacyStatus;
        if (cancelled) return;
        applyStatus({
          regionMode: data.regionMode === "open" ? "open" : "consent_required",
          consent:
            data.consent === "granted" || data.consent === "denied" ? data.consent : "unset",
          collectionAllowed: Boolean(data.collectionAllowed),
          engagementEnabled: Boolean(data.engagementEnabled),
        });
      } catch {
        if (cancelled) return;
        // Fail closed: unknown → no collection until we know otherwise.
        applyStatus({
          regionMode: "consent_required",
          consent: "unset",
          collectionAllowed: false,
          engagementEnabled: false,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribeAnalyticsPrivacy(() => {
      setCollectionAllowedState(isAnalyticsCollectionAllowed());
    });
  }, []);

  const setConsentChoice = useCallback(async (choice: "granted" | "denied") => {
    const res = await fetch("/api/analytics-privacy", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      // Do not send country — server derives geography.
      body: JSON.stringify({ choice }),
    });
    const data = (await res.json()) as PrivacyStatus & { ok?: boolean };
    if (!res.ok) return;
    applyStatus({
      regionMode: data.regionMode === "open" ? "open" : "consent_required",
      consent: choice,
      collectionAllowed: Boolean(data.collectionAllowed),
      engagementEnabled: Boolean(data.engagementEnabled),
    });
    setPreferencesOpen(false);
  }, []);

  const regionMode = status?.regionMode ?? null;
  const consent = status?.consent ?? null;
  const showBanner =
    ready &&
    regionMode === "consent_required" &&
    (consent === "unset" || preferencesOpen);

  const value: AnalyticsPrivacyContextValue = {
    ready,
    regionMode,
    consent,
    collectionAllowed,
    showBanner,
    preferencesOpen,
    openPreferences: () => setPreferencesOpen(true),
    closePreferences: () => setPreferencesOpen(false),
    setConsentChoice,
  };

  return (
    <AnalyticsPrivacyContext.Provider value={value}>{children}</AnalyticsPrivacyContext.Provider>
  );
}

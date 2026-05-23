"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { diagHistoryReplace } from "@/lib/admin-builder-diagnostics";
import {
  SITE_BUILDER_PATH,
  mergeSiteBuilderSearchState,
  parseSiteBuilderSearchParams,
  siteBuilderHref,
  type SiteBuilderSearchState,
} from "@/lib/site-builder/site-builder-url";

type SiteBuilderUrlContextValue = {
  state: SiteBuilderSearchState;
  navigate: (patch: Partial<SiteBuilderSearchState>, options?: { replace?: boolean }) => void;
};

const SiteBuilderUrlContext = createContext<SiteBuilderUrlContextValue | null>(null);

function readStateFromWindow(): SiteBuilderSearchState {
  if (typeof window === "undefined") {
    return parseSiteBuilderSearchParams({ get: () => null });
  }
  return parseSiteBuilderSearchParams(new URLSearchParams(window.location.search));
}

export function SiteBuilderUrlProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serverParsed = parseSiteBuilderSearchParams(searchParams);

  const [state, setState] = useState(serverParsed);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const onPopState = () => {
      if (pathname !== SITE_BUILDER_PATH) return;
      const next = readStateFromWindow();
      stateRef.current = next;
      setState(next);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [pathname]);

  const navigate = useCallback(
    (patch: Partial<SiteBuilderSearchState>, options?: { replace?: boolean }) => {
      const next = mergeSiteBuilderSearchState(stateRef.current, patch);
      stateRef.current = next;
      setState(next);

      if (pathname !== SITE_BUILDER_PATH) return;

      const href = siteBuilderHref(next);
      const method = options?.replace === false ? "pushState" : "replaceState";
      window.history[method](window.history.state, "", href);
      diagHistoryReplace(href);
    },
    [pathname],
  );

  return (
    <SiteBuilderUrlContext.Provider value={{ state, navigate }}>
      {children}
    </SiteBuilderUrlContext.Provider>
  );
}

export function useSiteBuilderNavigation(): SiteBuilderUrlContextValue {
  const ctx = useContext(SiteBuilderUrlContext);
  if (ctx) return ctx;

  // Fallback if provider missing (tests / isolated stories).
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const state = parseSiteBuilderSearchParams(searchParams);
  return {
    state,
    navigate: () => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[site-builder] navigate called without SiteBuilderUrlProvider");
      }
      void pathname;
    },
  };
}

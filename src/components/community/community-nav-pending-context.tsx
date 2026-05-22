"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type NavPendingContextValue = {
  pathname: string;
  pendingHref: string | null;
  setPendingHref: (href: string | null) => void;
  isPending: (href: string) => boolean;
  isSelected: (href: string, activeFromPath: boolean) => boolean;
};

const NavPendingContext = createContext<NavPendingContextValue | null>(null);

export function CommunityNavPendingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  const isPending = useCallback(
    (href: string) => pendingHref === href,
    [pendingHref],
  );

  const isSelected = useCallback(
    (href: string, activeFromPath: boolean) =>
      activeFromPath || pendingHref === href,
    [pendingHref],
  );

  const value = useMemo(
    () => ({
      pathname,
      pendingHref,
      setPendingHref,
      isPending,
      isSelected,
    }),
    [pathname, pendingHref, isPending, isSelected],
  );

  return (
    <NavPendingContext.Provider value={value}>{children}</NavPendingContext.Provider>
  );
}

export function useCommunityNavPending(): NavPendingContextValue {
  const ctx = useContext(NavPendingContext);
  if (!ctx) {
    throw new Error("useCommunityNavPending must be used within CommunityNavPendingProvider");
  }
  return ctx;
}

/** Safe when provider is optional (e.g. previews) */
export function useCommunityNavPendingOptional(): NavPendingContextValue | null {
  return useContext(NavPendingContext);
}

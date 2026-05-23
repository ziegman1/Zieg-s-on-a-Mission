"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  mergeSiteBuilderSearchState,
  parseSiteBuilderSearchParams,
  siteBuilderHref,
  type SiteBuilderSearchState,
} from "@/lib/site-builder/site-builder-url";

export function useSiteBuilderNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const state = useMemo(
    () => parseSiteBuilderSearchParams(searchParams),
    [searchParams],
  );

  const navigate = useCallback(
    (patch: Partial<SiteBuilderSearchState>, options?: { replace?: boolean }) => {
      const next = mergeSiteBuilderSearchState(state, patch);
      const href = siteBuilderHref(next);
      if (pathname !== "/admin/site-builder") {
        router.replace(href);
        return;
      }
      if (options?.replace === false) {
        router.push(href);
      } else {
        router.replace(href);
      }
    },
    [state, router, pathname],
  );

  return { state, navigate };
}

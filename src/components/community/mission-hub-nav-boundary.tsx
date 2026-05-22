"use client";

import type { ReactNode } from "react";
import { CommunityNavPendingProvider } from "./community-nav-pending-context";

/** Wraps Mission Hub chrome so nav links share optimistic pending/selected state. */
export function MissionHubNavBoundary({ children }: { children: ReactNode }) {
  return <CommunityNavPendingProvider>{children}</CommunityNavPendingProvider>;
}

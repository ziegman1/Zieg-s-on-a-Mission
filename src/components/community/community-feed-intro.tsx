import type { ReactNode } from "react";

/** Minimal one-line context above the feed (not a hero block). */
export function CommunityFeedIntro({ children }: { children: ReactNode }) {
  return (
    <p className="text-[13px] text-brand-ink/60 leading-relaxed px-0.5">{children}</p>
  );
}

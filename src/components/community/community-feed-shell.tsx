import type { ReactNode } from "react";
import { MH } from "@/lib/community/hub-design";
import { cn } from "@/lib/utils";

export function CommunityFeedShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 w-full", className)}>
      <div
        className={cn(
          "mx-auto w-full",
          className?.includes("spiritual-feed")
            ? "space-y-5 sm:space-y-6"
            : "space-y-2.5 sm:space-y-3",
          MH.feedMax,
        )}
      >
        {children}
      </div>
    </div>
  );
}

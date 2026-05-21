"use client";

import Link from "next/link";
import { LogOut, Shield } from "lucide-react";
import { communityOwnerSignOutAction } from "@/app/(storefront)/community/owner-sign-out-action";
import { buildOwnerLoginUrl } from "@/lib/auth-callback";
import type { CommunityOwner } from "@/lib/community/owner-types";
import { CommunityAvatar } from "./community-avatar";
import { cn } from "@/lib/utils";

export function CommunityOwnerChrome({
  owner,
  returnPath,
  className,
}: {
  owner: CommunityOwner | null;
  /** Path to return after sign-in or sign-out, e.g. /community or /community/prayer */
  returnPath: string;
  className?: string;
}) {
  if (owner) {
    const displayName = owner.name?.trim() || owner.email?.split("@")[0] || "Owner";
    return (
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-2xl border border-brand-primary/20 bg-white/95 px-3 py-2 shadow-sm",
          className,
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CommunityAvatar name={displayName} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-ink truncate">{displayName}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary">
              <Shield className="h-3 w-3" aria-hidden />
              Owner mode
            </span>
          </div>
        </div>
        <form
          action={async () => {
            await communityOwnerSignOutAction(returnPath);
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-brand-ink/65 hover:text-brand-ink hover:bg-brand-surface/80 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden />
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <p className={cn("text-right text-[11px] text-brand-ink/40", className)}>
      <Link
        href={buildOwnerLoginUrl(returnPath)}
        className="hover:text-brand-primary/80 transition-colors underline-offset-2 hover:underline"
      >
        Owner sign in
      </Link>
    </p>
  );
}

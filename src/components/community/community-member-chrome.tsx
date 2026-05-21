"use client";

import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { communitySignOutAction } from "@/app/(storefront)/community/auth-actions";
import { formatMemberDisplayName, type CommunityMemberProfile } from "@/lib/community/members";
import { CommunityAvatar } from "./community-avatar";
import { cn } from "@/lib/utils";

export function CommunityMemberChrome({
  member,
  returnPath,
  className,
}: {
  member: CommunityMemberProfile | null;
  returnPath: string;
  className?: string;
}) {
  if (!member) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-end gap-2 text-xs text-brand-ink/55",
          className,
        )}
      >
        <Link
          href={`/community/login?callbackUrl=${encodeURIComponent(returnPath)}`}
          className="font-medium text-brand-primary hover:underline"
        >
          Sign in
        </Link>
        <span aria-hidden>·</span>
        <Link
          href={`/community/join?callbackUrl=${encodeURIComponent(returnPath)}`}
          className="font-medium text-brand-primary hover:underline"
        >
          Join
        </Link>
      </div>
    );
  }

  const name = formatMemberDisplayName(member.firstName, member.lastName);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border border-brand-primary/15 bg-white/95 px-3 py-2 shadow-sm",
        className,
      )}
    >
      <Link
        href="/community/profile"
        className="flex items-center gap-2.5 min-w-0 hover:opacity-90 transition-opacity"
      >
        <CommunityAvatar name={name} imageUrl={member.profileImageUrl} size="sm" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-brand-ink truncate">{name}</p>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-brand-ink/50">
            <User className="h-3 w-3" aria-hidden />
            Your profile
          </span>
        </div>
      </Link>
      <form
        action={async () => {
          await communitySignOutAction(returnPath);
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

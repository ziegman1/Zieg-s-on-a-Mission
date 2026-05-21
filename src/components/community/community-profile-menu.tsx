"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Settings, Shield, User } from "lucide-react";
import { communitySignOutAction } from "@/app/(storefront)/community/auth-actions";
import { communityOwnerSignOutAction } from "@/app/(storefront)/community/owner-sign-out-action";
import { formatMemberDisplayName, type CommunityMemberProfile } from "@/lib/community/members";
import type { CommunityOwner } from "@/lib/community/owner-types";
import { CommunityAvatar } from "./community-avatar";
import { cn } from "@/lib/utils";

export function CommunityProfileMenu({
  owner,
  member,
  accountImageUrl = null,
  returnPath = "/community",
}: {
  owner: CommunityOwner | null;
  member: CommunityMemberProfile | null;
  /** User.image — used for ADMIN/STAFF when no member profile row */
  accountImageUrl?: string | null;
  returnPath?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const memberName = member
    ? formatMemberDisplayName(member.firstName, member.lastName)
    : null;
  const ownerName =
    owner?.name?.trim() || owner?.email?.split("@")[0] || "Owner";
  const displayName = owner ? ownerName : memberName ?? "Guest";
  const imageUrl = member?.profileImageUrl ?? accountImageUrl ?? null;
  const isSignedIn = Boolean(owner || member);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const settingsHref = owner
    ? "/community/settings?section=hub"
    : "/community/settings?section=profile";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "rounded-full p-0.5 ring-2 transition-all duration-150",
          open ? "ring-brand-primary/50" : "ring-transparent hover:ring-brand-primary/25",
        )}
        aria-label="Account and settings"
      >
        <CommunityAvatar name={displayName} imageUrl={imageUrl} size="sm" />
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" aria-hidden onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 z-50 w-56 rounded-2xl border border-black/5 bg-white py-1.5 shadow-lg shadow-black/10 animate-in fade-in zoom-in-95 duration-150 origin-top-right"
          >
            <div className="px-3 py-2.5 border-b border-black/5">
              <p className="text-sm font-semibold text-brand-ink truncate">{displayName}</p>
              {owner ? (
                <p className="text-[10px] font-medium uppercase tracking-wide text-brand-primary mt-0.5">
                  Owner
                </p>
              ) : member ? (
                <p className="text-[11px] text-brand-ink/50 mt-0.5 truncate">
                  {member.email ?? "Member"}
                </p>
              ) : (
                <p className="text-[11px] text-brand-ink/50 mt-0.5">Not signed in</p>
              )}
            </div>

            {isSignedIn ? (
              <>
                <Link
                  role="menuitem"
                  href={settingsHref}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-brand-ink hover:bg-brand-surface/80"
                >
                  <User className="h-4 w-4 text-brand-primary" aria-hidden />
                  Profile
                </Link>
                <Link
                  role="menuitem"
                  href="/community/settings?section=notifications"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-brand-ink hover:bg-brand-surface/80"
                >
                  <Bell className="h-4 w-4 text-brand-primary" aria-hidden />
                  Notifications
                </Link>
                <Link
                  role="menuitem"
                  href="/community/settings"
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 text-sm text-brand-ink hover:bg-brand-surface/80",
                    pathname.startsWith("/community/settings") && "bg-brand-primary/5",
                  )}
                >
                  <Settings className="h-4 w-4 text-brand-primary" aria-hidden />
                  Settings
                </Link>
                {owner ? (
                  <Link
                    role="menuitem"
                    href="/community/settings?section=community"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-brand-ink hover:bg-brand-surface/80"
                  >
                    <Shield className="h-4 w-4 text-brand-primary" aria-hidden />
                    Admin controls
                  </Link>
                ) : null}
              </>
            ) : null}

            {isSignedIn ? (
              <form
                action={async () => {
                  setOpen(false);
                  if (owner) {
                    await communityOwnerSignOutAction(returnPath);
                  } else {
                    await communitySignOutAction(returnPath);
                  }
                  router.refresh();
                }}
                className="border-t border-black/5 mt-1 pt-1"
              >
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-brand-ink hover:bg-brand-surface/80 text-left"
                >
                  <LogOut className="h-4 w-4 text-brand-ink/60" aria-hidden />
                  Sign out
                </button>
              </form>
            ) : (
              <div className="border-t border-black/5 mt-1 pt-1 px-3 py-2 space-y-1">
                <Link
                  href={`/community/login?callbackUrl=${encodeURIComponent(returnPath)}`}
                  className="block text-sm font-medium text-brand-primary hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href={`/community/join?callbackUrl=${encodeURIComponent(returnPath)}`}
                  className="block text-sm text-brand-ink/70 hover:underline"
                  onClick={() => setOpen(false)}
                >
                  Join Mission Hub
                </Link>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

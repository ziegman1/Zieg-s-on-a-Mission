"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HandHeart, Home, Layers, Loader2, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCommunityNavPending } from "./community-nav-pending-context";
import { CommunityInviteSheet } from "./community-invite-sheet";
import { MissionHubNavLink } from "./mission-hub-nav-link";
import { navTapActive, navTapBase, navTapPressed } from "./mission-hub-nav-styles";
import { cn } from "@/lib/utils";

type NavLinkItem = {
  kind: "link";
  href: string;
  label: string;
  icon: LucideIcon;
  match: (p: string) => boolean;
  prefetch?: boolean;
};

type NavInviteItem = {
  kind: "invite";
  label: "Invite";
  icon: LucideIcon;
};

type NavItem = NavLinkItem | NavInviteItem;

const NAV: NavItem[] = [
  {
    kind: "link",
    href: "/community",
    label: "Home",
    icon: Home,
    match: (p) => p === "/community",
    prefetch: true,
  },
  {
    kind: "link",
    href: "/community/spaces",
    label: "Spaces",
    icon: Layers,
    match: (p) => p === "/community/spaces",
    prefetch: true,
  },
  {
    kind: "link",
    href: "/partner",
    label: "Partner",
    icon: HandHeart,
    match: () => false,
    prefetch: true,
  },
  {
    kind: "invite",
    label: "Invite",
    icon: UserPlus,
  },
];

export function CommunityBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isPending, isSelected } = useCommunityNavPending();
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    for (const item of NAV) {
      if (item.kind === "link") router.prefetch(item.href);
    }
  }, [router]);

  return (
    <>
      <nav
        className={cn(
          "lg:hidden fixed bottom-0 inset-x-0 z-40",
          "border-t border-black/[0.06]",
          "bg-white/88 backdrop-blur-xl supports-[backdrop-filter]:bg-white/78",
          "shadow-[0_-4px_24px_rgba(28,42,68,0.08)]",
          "pb-[env(safe-area-inset-bottom)]",
        )}
        aria-label="Mission Hub"
      >
        <ul className="flex items-stretch justify-around max-w-lg mx-auto px-1">
          {NAV.map((item) => {
            if (item.kind === "invite") {
              const { label, icon: Icon } = item;
              const selected = inviteOpen;
              return (
                <li key={label} className="flex-1 max-w-[5.5rem]">
                  <button
                    type="button"
                    onClick={() => setInviteOpen(true)}
                    className={cn(
                      navTapBase,
                      navTapPressed,
                      "flex flex-col items-center justify-center gap-0.5 min-h-[3.25rem] px-2 w-full",
                      "text-[10px] font-semibold tracking-wide",
                      selected ? "text-brand-primary" : "text-brand-ink/50",
                      navTapActive(selected, false),
                    )}
                    aria-haspopup="dialog"
                    aria-expanded={inviteOpen}
                  >
                    <span
                      className={cn(
                        "relative flex h-8 w-8 items-center justify-center rounded-2xl transition-colors duration-75",
                        selected ? "bg-brand-primary/12" : "bg-transparent",
                      )}
                    >
                      <Icon
                        className={cn("h-[1.35rem] w-[1.35rem]", selected && "stroke-[2.25]")}
                        aria-hidden
                      />
                    </span>
                    {label}
                  </button>
                </li>
              );
            }

            const { href, label, icon: Icon, match, prefetch } = item;
            const activeFromPath = match(pathname);
            const selected = isSelected(href, activeFromPath);
            const pending = isPending(href);
            return (
              <li key={label} className="flex-1 max-w-[5.5rem]">
                <MissionHubNavLink
                  href={href}
                  prefetch={prefetch}
                  activeFromPath={activeFromPath}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 min-h-[3.25rem] px-2",
                    "text-[10px] font-semibold tracking-wide",
                    selected ? "text-brand-primary" : "text-brand-ink/50",
                    navTapActive(selected, pending),
                  )}
                >
                  <span
                    className={cn(
                      "relative flex h-8 w-8 items-center justify-center rounded-2xl transition-colors duration-75",
                      selected ? "bg-brand-primary/12" : "bg-transparent",
                      pending && "bg-brand-primary/20",
                    )}
                  >
                    {pending ? (
                      <Loader2
                        className="absolute h-3.5 w-3.5 animate-spin text-brand-primary/70"
                        aria-hidden
                      />
                    ) : null}
                    <Icon
                      className={cn(
                        "h-[1.35rem] w-[1.35rem]",
                        selected && "stroke-[2.25]",
                        pending && "opacity-40",
                      )}
                      aria-hidden
                    />
                  </span>
                  {label}
                </MissionHubNavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <CommunityInviteSheet open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}

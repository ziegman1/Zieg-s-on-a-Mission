"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HandHeart, Home, Layers, Loader2, MessageCircle } from "lucide-react";
import { useCommunityNavPending } from "./community-nav-pending-context";
import { MissionHubNavLink } from "./mission-hub-nav-link";
import { navTapActive } from "./mission-hub-nav-styles";
import { cn } from "@/lib/utils";

const NAV = [
  {
    href: "/community",
    label: "Home",
    icon: Home,
    match: (p: string) => p === "/community",
    prefetch: true,
  },
  {
    href: "/community/spaces",
    label: "Spaces",
    icon: Layers,
    match: (p: string) => p === "/community/spaces",
    prefetch: true,
  },
  {
    href: "/partner",
    label: "Partner",
    icon: HandHeart,
    match: () => false,
    prefetch: true,
  },
  {
    href: "/contact",
    label: "Connect",
    icon: MessageCircle,
    match: () => false,
    prefetch: true,
  },
] as const;

export function CommunityBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isPending, isSelected } = useCommunityNavPending();

  useEffect(() => {
    for (const { href } of NAV) {
      router.prefetch(href);
    }
  }, [router]);

  return (
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
        {NAV.map(({ href, label, icon: Icon, match, prefetch }) => {
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
  );
}

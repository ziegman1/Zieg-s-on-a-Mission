"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HandHeart, Home, Layers, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  {
    href: "/community",
    label: "Home",
    icon: Home,
    match: (p: string) => p === "/community",
  },
  {
    href: "/community/spaces",
    label: "Spaces",
    icon: Layers,
    match: (p: string) => p === "/community/spaces",
  },
  { href: "/partner", label: "Partner", icon: HandHeart, match: () => false },
  { href: "/contact", label: "Connect", icon: MessageCircle, match: () => false },
] as const;

export function CommunityBottomNav() {
  const pathname = usePathname();

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
        {NAV.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={label} className="flex-1 max-w-[5.5rem]">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-h-[3.25rem] px-2",
                  "text-[10px] font-semibold tracking-wide transition-all duration-150",
                  "active:scale-95",
                  active ? "text-brand-primary" : "text-brand-ink/50",
                )}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-2xl transition-colors",
                    active ? "bg-brand-primary/12" : "bg-transparent",
                  )}
                >
                  <Icon
                    className={cn("h-[1.35rem] w-[1.35rem]", active && "stroke-[2.25]")}
                    aria-hidden
                  />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

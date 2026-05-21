"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/community", label: "Spaces" },
  { href: "/admin/community/posts", label: "Posts" },
  { href: "/admin/community/comments", label: "Comments" },
  { href: "/admin/community/members", label: "Members" },
] as const;

export function CommunityAdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 border-b border-brand-primary/30 pb-4 mb-6" aria-label="Mission Hub admin">
      {TABS.map(({ href, label }) => {
        const active =
          href === "/admin/community"
            ? pathname === "/admin/community"
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-primary text-white"
                : "text-zinc-400 hover:text-brand-accent hover:bg-zinc-800",
            )}
            aria-current={active ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

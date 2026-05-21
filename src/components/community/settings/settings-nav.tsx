"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  KeyRound,
  LayoutGrid,
  Shield,
  User,
  Users,
} from "lucide-react";
import type { SettingsSection } from "@/lib/community/settings-types";
import { cn } from "@/lib/utils";

const USER_NAV: {
  id: SettingsSection;
  label: string;
  icon: typeof User;
}[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Password", icon: KeyRound },
];

const ADMIN_NAV: {
  id: SettingsSection;
  label: string;
  icon: typeof LayoutGrid;
}[] = [
  { id: "hub", label: "Mission Hub", icon: LayoutGrid },
  { id: "spaces", label: "Spaces", icon: LayoutGrid },
  { id: "community", label: "Community", icon: Users },
];

function NavItem({
  id,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  id: SettingsSection;
  label: string;
  icon: typeof User;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={`/community/settings?section=${id}`}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-brand-primary/10 text-brand-primary"
          : "text-brand-ink/65 hover:bg-black/[0.03] hover:text-brand-ink",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      {label}
    </Link>
  );
}

export function SettingsNav({
  isAdmin,
  activeSection,
  className,
  onNavigate,
}: {
  isAdmin: boolean;
  activeSection: SettingsSection;
  className?: string;
  onNavigate?: () => void;
}) {
  const searchParams = useSearchParams();
  const section = searchParams.get("section") ?? activeSection;

  return (
    <nav className={cn("flex flex-col min-h-0", className)} aria-label="Settings">
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink/50 hover:text-brand-primary mb-4 px-1"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to feed
      </Link>

      <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-brand-ink/40 mb-1">
        Your settings
      </p>
      <div className="space-y-0.5">
        {USER_NAV.map((item) => (
          <NavItem
            key={item.id}
            {...item}
            active={section === item.id}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {isAdmin ? (
        <>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-brand-ink/40 mt-5 mb-1 flex items-center gap-1">
            <Shield className="h-3 w-3" aria-hidden />
            Admin
          </p>
          <div className="space-y-0.5">
            {ADMIN_NAV.map((item) => (
              <NavItem
                key={item.id}
                {...item}
                active={section === item.id}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </>
      ) : null}
    </nav>
  );
}

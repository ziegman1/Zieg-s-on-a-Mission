"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Bell,
  ChevronLeft,
  HeartHandshake,
  KeyRound,
  LayoutGrid,
  Shield,
  User,
  Users,
} from "lucide-react";
import type { SettingsSection } from "@/lib/community/settings-types";
import { MissionHubNavLink } from "../mission-hub-nav-link";
import { navTapActive, navTapBase, navTapPressed } from "../mission-hub-nav-styles";
import { cn } from "@/lib/utils";

const USER_NAV: {
  id: SettingsSection;
  label: string;
  icon: typeof User;
}[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "partnership", label: "Partnership", icon: HeartHandshake },
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
  pending,
  onNavigate,
  onPending,
}: {
  id: SettingsSection;
  label: string;
  icon: typeof User;
  active: boolean;
  pending: boolean;
  onNavigate?: () => void;
  onPending: (id: SettingsSection) => void;
}) {
  const href = `/community/settings?section=${id}`;
  const selected = active || pending;

  return (
    <Link
      href={href}
      prefetch
      onPointerDown={() => onPending(id)}
      onClick={onNavigate}
      className={cn(
        navTapBase,
        navTapPressed,
        "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium",
        selected
          ? "bg-brand-primary/10 text-brand-primary"
          : "text-brand-ink/65 hover:bg-black/[0.03] hover:text-brand-ink",
        navTapActive(selected, pending),
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
  const section = (searchParams.get("section") ?? activeSection) as SettingsSection;
  const [pendingSection, setPendingSection] = useState<SettingsSection | null>(null);

  useEffect(() => {
    setPendingSection(null);
  }, [section]);

  const handlePending = (id: SettingsSection) => {
    setPendingSection(id);
  };

  return (
    <nav className={cn("flex flex-col min-h-0", className)} aria-label="Settings">
      <MissionHubNavLink
        href="/community"
        prefetch
        activeFromPath={false}
        className={cn(
          navTapBase,
          navTapPressed,
          "inline-flex items-center gap-1.5 text-sm font-medium text-brand-ink/50 hover:text-brand-primary mb-4 px-1",
        )}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back to feed
      </MissionHubNavLink>

      <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-brand-ink/40 mb-1">
        Your settings
      </p>
      <div className="space-y-0.5">
        {USER_NAV.map((item) => (
          <NavItem
            key={item.id}
            {...item}
            active={section === item.id}
            pending={pendingSection === item.id && section !== item.id}
            onNavigate={onNavigate}
            onPending={handlePending}
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
                pending={pendingSection === item.id && section !== item.id}
                onNavigate={onNavigate}
                onPending={handlePending}
              />
            ))}
          </div>
        </>
      ) : null}
    </nav>
  );
}

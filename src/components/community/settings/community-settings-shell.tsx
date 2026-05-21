"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import type { SettingsPageData } from "@/lib/community/settings-types";
import { SettingsContent } from "./settings-content";
import { SettingsNav } from "./settings-nav";
import { cn } from "@/lib/utils";

export function CommunitySettingsShell({ data }: { data: SettingsPageData }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] w-full">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-5">
        <div className="flex items-center justify-between gap-3 mb-4 lg:hidden">
          <h1 className="text-lg font-semibold text-brand-ink">Settings</h1>
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-brand-ink"
            aria-expanded={mobileNavOpen}
            aria-label="Settings menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          <aside
            className={cn(
              "lg:w-52 shrink-0",
              mobileNavOpen ? "block" : "hidden lg:block",
            )}
          >
            <SettingsNav
              isAdmin={data.isAdmin}
              activeSection={data.section}
              onNavigate={() => setMobileNavOpen(false)}
            />
          </aside>

          <div className="min-w-0 flex-1 pb-8">
            <div className="hidden lg:block mb-5">
              <h1 className="text-xl font-semibold text-brand-ink">Settings</h1>
              <p className="text-sm text-brand-ink/50 mt-0.5">
                Manage your profile and preferences
              </p>
            </div>
            <SettingsContent data={data} />
          </div>
        </div>
      </div>
    </div>
  );
}

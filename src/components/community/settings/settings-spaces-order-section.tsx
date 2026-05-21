"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { AdminSpaceSettingsRow } from "@/lib/community/settings-types";
import { sortSpacesByDisplayOrder } from "@/lib/community/space-order";
import type { CommunitySpaceOrderItem } from "@/lib/community/space-order";
import { SettingsSpacesOrderPanel } from "./settings-spaces-order-panel";
import { cn } from "@/lib/utils";

function toOrderItems(spaces: AdminSpaceSettingsRow[]): CommunitySpaceOrderItem[] {
  return spaces.map((s) => ({
    id: s.id,
    title: s.title,
    slug: s.slug,
    status: s.status,
    sortOrder: s.sortOrder,
  }));
}

function buildOrderSummary(spaces: AdminSpaceSettingsRow[]): string {
  return sortSpacesByDisplayOrder(spaces)
    .map((s) => s.title)
    .join(", ");
}

export function SettingsSpacesOrderSection({ spaces }: { spaces: AdminSpaceSettingsRow[] }) {
  const [open, setOpen] = useState(false);
  const summary = useMemo(() => buildOrderSummary(spaces), [spaces]);
  const orderItems = useMemo(() => toOrderItems(spaces), [spaces]);

  if (spaces.length < 2) {
    return (
      <p className="text-xs text-brand-ink/50">
        Add another room to change display order.
      </p>
    );
  }

  return (
    <section className="rounded-lg border border-black/[0.05] bg-brand-surface/15 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "w-full flex items-start gap-3 px-4 py-3 text-left",
          "hover:bg-black/[0.02] transition-colors",
          open && "border-b border-black/[0.04]",
        )}
      >
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-primary/80">
            Display order
          </span>
          <p className="mt-1 text-xs text-brand-ink/55 leading-relaxed">
            Arrange how rooms appear in Mission Hub.
          </p>
          {!open ? (
            <p className="mt-2 text-sm text-brand-ink/70 truncate" title={summary}>
              {summary}
            </p>
          ) : null}
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-brand-ink/40 mt-0.5 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="px-4 pb-4 pt-1">
          <SettingsSpacesOrderPanel spaces={orderItems} compact />
        </div>
      ) : null}
    </section>
  );
}

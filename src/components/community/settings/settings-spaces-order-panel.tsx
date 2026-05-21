"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { reorderCommunitySpacesAction } from "@/app/(storefront)/community/settings-actions";
import {
  isDefaultFirstSpaceSlug,
  type CommunitySpaceOrderItem,
} from "@/lib/community/space-order";
import { cn } from "@/lib/utils";

function sortRows(spaces: CommunitySpaceOrderItem[]): CommunitySpaceOrderItem[] {
  return [...spaces].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title);
  });
}

export function SettingsSpacesOrderPanel({
  spaces,
  compact = false,
}: {
  spaces: CommunitySpaceOrderItem[];
  /** When true, omits intro copy (parent section provides context). */
  compact?: boolean;
}) {
  const [ordered, setOrdered] = useState(() => sortRows(spaces));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setOrdered(sortRows(spaces));
  }, [spaces]);

  const published = useMemo(
    () => ordered.filter((s) => s.status === "published"),
    [ordered],
  );

  function persist(next: CommunitySpaceOrderItem[]) {
    setOrdered(next);
    setError(null);
    startTransition(async () => {
      const res = await reorderCommunitySpacesAction(next.map((s) => s.id));
      if (!res.ok) {
        setError(res.error);
        setOrdered(sortRows(spaces));
      } else {
        router.refresh();
      }
    });
  }

  function move(id: string, direction: -1 | 1) {
    const idx = ordered.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const target = idx + direction;
    if (target < 0 || target >= ordered.length) return;
    const next = [...ordered];
    const tmp = next[idx]!;
    next[idx] = next[target]!;
    next[target] = tmp;
    persist(next);
  }

  if (spaces.length < 2) {
    return (
      <p className="text-xs text-brand-ink/50">
        Add another space to enable reordering.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {!compact ? (
        <p className="text-xs text-brand-ink/55 leading-relaxed">
          Order shown in the sidebar, filter pills, spaces list, and post composer.
          Start Here / Welcome is placed first when created; use the arrows to override
          display order for all rooms.
        </p>
      ) : null}
      <ul
        className={cn(
          "rounded-lg border border-black/[0.06] overflow-hidden divide-y divide-black/[0.04]",
          pending && "opacity-70 pointer-events-none",
        )}
        aria-label="Space display order"
      >
        {ordered.map((space, index) => {
          const pinnedHint = isDefaultFirstSpaceSlug(space.slug);
          return (
            <li
              key={space.id}
              className="flex items-center gap-2 px-3 py-2.5 bg-white/70"
            >
              <GripVertical className="h-4 w-4 shrink-0 text-brand-ink/25" aria-hidden />
              <span className="text-[11px] tabular-nums text-brand-ink/40 w-5 shrink-0">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-brand-ink truncate">{space.title}</p>
                <p className="text-[11px] text-brand-ink/45 truncate">
                  /{space.slug}
                  {space.status !== "published" ? ` · ${space.status}` : ""}
                  {pinnedHint ? " · onboarding" : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-0.5">
                <button
                  type="button"
                  disabled={index === 0 || pending}
                  onClick={() => move(space.id, -1)}
                  className={cn(
                    "p-1 rounded-md text-brand-ink/50 hover:bg-black/[0.04] hover:text-brand-ink",
                    "disabled:opacity-30 disabled:pointer-events-none",
                  )}
                  aria-label={`Move ${space.title} up`}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={index === ordered.length - 1 || pending}
                  onClick={() => move(space.id, 1)}
                  className={cn(
                    "p-1 rounded-md text-brand-ink/50 hover:bg-black/[0.04] hover:text-brand-ink",
                    "disabled:opacity-30 disabled:pointer-events-none",
                  )}
                  aria-label={`Move ${space.title} down`}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {published.length > 0 && published.length < ordered.length ? (
        <p className="text-[11px] text-brand-ink/45">
          {published.length} published · {ordered.length - published.length} draft/archived
          still appear in admin order.
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {pending ? (
        <p className="text-xs text-brand-ink/45">Saving order…</p>
      ) : null}
    </div>
  );
}

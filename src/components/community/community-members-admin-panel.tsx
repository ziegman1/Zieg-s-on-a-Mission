"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import type { AdminMemberPortalRow } from "@/lib/community/admin-members-portal-types";
import type { AdminMembersHubPreview } from "@/lib/community/admin-members-preview-types";
import {
  DEFAULT_MEMBER_PORTAL_FILTERS,
  filterAdminMemberRows,
} from "@/lib/community/admin-members-portal-filters";
import { formatMemberDisplayName } from "@/lib/community/members";
import { CommunityAvatar } from "./community-avatar";
import { cn } from "@/lib/utils";

function formatJoined(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl bg-brand-surface/80 px-3 py-2 min-w-0 flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-ink/45">
        {label}
      </p>
      <p className="text-lg font-semibold text-brand-primary tabular-nums leading-tight">
        {value}
      </p>
    </div>
  );
}

function MemberRow({ row }: { row: AdminMemberPortalRow }) {
  const name =
    row.displayName?.trim() ||
    formatMemberDisplayName(row.firstName, row.lastName);
  const email = row.userEmail?.trim() || row.email?.trim();
  const showRole =
    row.userRole === "ADMIN" ||
    row.userRole === "STAFF" ||
    row.userRole === "CUSTOMER";

  return (
    <li className="flex items-center gap-3 py-2.5 border-b border-black/[0.04] last:border-0">
      <CommunityAvatar
        name={name}
        imageUrl={row.profileImageUrl}
        size="sm"
        className="!h-9 !w-9 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium text-brand-ink truncate">{name}</p>
          {showRole && row.userRole !== "CUSTOMER" ? (
            <span className="shrink-0 rounded-full bg-brand-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-brand-primary">
              {row.userRoleLabel}
            </span>
          ) : null}
          {row.status !== "active" ? (
            <span className="shrink-0 rounded-full bg-black/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-brand-ink/50 capitalize">
              {row.status}
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-brand-ink/50 truncate">
          {email ?? "No email"} · Joined {formatJoined(row.joinedAt)}
        </p>
      </div>
    </li>
  );
}

export function CommunityMembersAdminPanel({
  preview,
  members,
  loading,
  error,
}: {
  preview: AdminMembersHubPreview;
  members: AdminMemberPortalRow[] | null;
  loading: boolean;
  error: string | null;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!members) return [];
    return filterAdminMemberRows(members, {
      ...DEFAULT_MEMBER_PORTAL_FILTERS,
      query,
      status: "all",
    });
  }, [members, query]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <StatPill label="Members" value={preview.totalMembers} />
        <StatPill label="Active today" value={preview.activeToday} />
        <StatPill label="Active this week" value={preview.activeThisWeek} />
      </div>

      <label className="relative block">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-ink/40"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email"
          className={cn(
            "h-9 w-full rounded-full border border-black/[0.08] bg-white pl-8 pr-3",
            "text-sm text-brand-ink placeholder:text-brand-ink/40",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30",
          )}
        />
      </label>

      {loading ? (
        <div className="flex justify-center py-10 text-brand-ink/45">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        </div>
      ) : error ? (
        <p className="py-6 text-center text-xs text-brand-ink/60">{error}</p>
      ) : !members ? (
        <p className="py-6 text-center text-xs text-brand-ink/55">Open to load members…</p>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-xs text-brand-ink/55">No members match your search.</p>
      ) : (
        <>
          <p className="text-[10px] text-brand-ink/45 px-0.5">
            Showing {filtered.length} of {members.length}
          </p>
          <ul className="max-h-[min(22rem,48dvh)] overflow-y-auto overscroll-contain -mx-1 px-1">
            {filtered.map((row) => (
              <MemberRow key={row.id} row={row} />
            ))}
          </ul>
        </>
      )}

      <Link
        href="/admin/community/members"
        className="block text-center text-xs font-medium text-brand-primary hover:underline py-1"
      >
        Full members admin →
      </Link>
    </div>
  );
}

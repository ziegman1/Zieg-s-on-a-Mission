"use client";

import { useMemo, useState, useTransition } from "react";
import { Loader2, Search, User } from "lucide-react";
import {
  getAdminMemberDetailAction,
  setCommunityMemberStatusAction,
  setMemberUserRoleAction,
} from "@/app/admin/community/member-actions";
import type { AdminMemberDetail, AdminMemberPortalRow } from "@/lib/community/admin-members-portal-types";
import {
  displayEmail,
  formatNotificationPrefsSummary,
} from "@/lib/community/admin-members-portal-types";
import { formatMemberDisplayName } from "@/lib/community/members";
import {
  collectMutedSpaceOptions,
  DEFAULT_MEMBER_PORTAL_FILTERS,
  filterAdminMemberRows,
  type MemberPortalFilters,
} from "@/lib/community/admin-members-portal-filters";
import { NOTIFICATION_PREF_LABELS, NOTIFICATION_CHANNEL_LABELS } from "@/lib/community/settings-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-[10px] text-zinc-500">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-xs text-zinc-200"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MemberDetailPanel({
  member,
  onClose,
  onRefresh,
}: {
  member: AdminMemberDetail;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const email = displayEmail(member);

  function runStatus(status: "active" | "blocked") {
    setError(null);
    startTransition(async () => {
      const res = await setCommunityMemberStatusAction(member.id, status);
      if (!res.ok) setError(res.error);
      else onRefresh();
    });
  }

  function runRole(role: "CUSTOMER" | "STAFF") {
    setError(null);
    startTransition(async () => {
      const res = await setMemberUserRoleAction(member.id, role);
      if (!res.ok) setError(res.error);
      else onRefresh();
    });
  }

  return (
    <div className="space-y-6 max-h-[min(70vh,640px)] overflow-y-auto pr-1">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
          <User className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-zinc-100">
            {member.displayName?.trim() ||
              formatMemberDisplayName(member.firstName, member.lastName)}
          </p>
          <p className="text-sm text-zinc-400">{email ?? "No email"}</p>
          <p className="text-xs text-zinc-500 mt-1">
            {member.userRoleLabel} · {member.status} · Joined {formatDate(member.joinedAt)}
          </p>
          <p className="text-xs text-zinc-500">
            Last active {formatDate(member.lastActiveAt)}
          </p>
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
          Admin actions
        </h3>
        <div className="flex flex-wrap gap-2">
          {member.status === "blocked" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => runStatus("active")}
              className="border-emerald-600/50 text-emerald-300"
            >
              Reactivate member
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => runStatus("blocked")}
              className="border-red-600/50 text-red-300"
            >
              Deactivate / block
            </Button>
          )}
          {member.hasLinkedAccount && member.userRole !== "ADMIN" ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending || member.userRole === "CUSTOMER"}
                onClick={() => runRole("CUSTOMER")}
              >
                Set as Member
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending || member.userRole === "STAFF"}
                onClick={() => runRole("STAFF")}
              >
                Set as Staff
              </Button>
            </>
          ) : null}
        </div>
        <p className="text-[10px] text-zinc-500 mt-2">
          Notification preferences are member-controlled in Mission Hub settings. Admins cannot
          edit them here. Invite links are shared from the community UI (no separate invite queue).
        </p>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
          Notification preferences (read-only)
        </h3>
        <ul className="text-xs text-zinc-300 space-y-1">
          {Object.entries(NOTIFICATION_CHANNEL_LABELS).map(([key, meta]) => (
            <li key={key}>
              {meta.label}:{" "}
              <span className="text-zinc-100">
                {member.notificationPreferences[key as keyof typeof member.notificationPreferences] === true
                  ? "On"
                  : "Off"}
              </span>
            </li>
          ))}
          {Object.entries(NOTIFICATION_PREF_LABELS).map(([key, meta]) => (
            <li key={key}>
              {meta.label}:{" "}
              <span className="text-zinc-100">
                {member.notificationPreferences[key as keyof typeof member.notificationPreferences] !== false
                  ? "On"
                  : "Off"}
              </span>
            </li>
          ))}
        </ul>
        {member.mutedSpaces.length > 0 ? (
          <p className="text-xs text-amber-400/90 mt-2">
            Muted spaces: {member.mutedSpaces.map((s) => s.title).join(", ")}
          </p>
        ) : (
          <p className="text-xs text-zinc-500 mt-2">No muted spaces.</p>
        )}
        <p className="text-xs text-zinc-500 mt-1">
          Unread in-app notifications: {member.unreadNotificationCount}
        </p>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
          Recent posts ({member.recentPosts.length})
        </h3>
        {member.recentPosts.length === 0 ? (
          <p className="text-xs text-zinc-500">No posts authored.</p>
        ) : (
          <ul className="text-xs space-y-2">
            {member.recentPosts.map((p) => (
              <li key={p.id} className="rounded-lg border border-zinc-800 px-3 py-2">
                <p className="text-zinc-200">{p.title?.trim() || "Untitled"}</p>
                <p className="text-zinc-500">
                  {p.spaceTitle} · {p.status} · {formatDate(p.publishedAt ?? p.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
          Recent comments ({member.recentComments.length})
        </h3>
        {member.recentComments.length === 0 ? (
          <p className="text-xs text-zinc-500">No comments yet.</p>
        ) : (
          <ul className="text-xs space-y-2">
            {member.recentComments.map((c) => (
              <li key={c.id} className="rounded-lg border border-zinc-800 px-3 py-2">
                <p className="text-zinc-300 line-clamp-3">{c.body}</p>
                <p className="text-zinc-500 mt-1">
                  {c.spaceTitle ?? "Post"} · {formatDate(c.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
          Email delivery log
        </h3>
        {member.emailDeliveries.length === 0 ? (
          <p className="text-xs text-zinc-500">No email deliveries recorded.</p>
        ) : (
          <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
            {member.emailDeliveries.map((d) => (
              <li key={d.id} className="text-zinc-400 font-mono">
                {d.notificationKind} · {d.status}
                {d.resendMessageId ? ` · ${d.resendMessageId}` : ""}
                {d.errorMessage ? ` · ${d.errorMessage}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">
          In-app notifications
        </h3>
        {member.notifications.length === 0 ? (
          <p className="text-xs text-zinc-500">None.</p>
        ) : (
          <ul className="text-xs space-y-1 max-h-40 overflow-y-auto">
            {member.notifications.map((n) => (
              <li key={n.id} className={cn(!n.readAt && "text-brand-accent")}>
                {n.title} · {n.type} · {n.readAt ? "read" : "unread"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex justify-end pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}

export function AdminMembersPortal({
  initialMembers,
}: {
  initialMembers: AdminMemberPortalRow[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [filters, setFilters] = useState<MemberPortalFilters>(DEFAULT_MEMBER_PORTAL_FILTERS);
  const [detail, setDetail] = useState<AdminMemberDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const mutedSpaceOptions = useMemo(() => collectMutedSpaceOptions(members), [members]);

  const filtered = useMemo(
    () => filterAdminMemberRows(members, filters),
    [members, filters],
  );

  async function openDetail(memberId: string) {
    setDetailError(null);
    setLoadingDetail(true);
    setDetailOpen(true);
    const res = await getAdminMemberDetailAction(memberId);
    setLoadingDetail(false);
    if (!res.ok) {
      setDetailError(res.error);
      setDetail(null);
      return;
    }
    setDetail(res.member);
  }

  function refreshDetail() {
    if (!detail) return;
    void openDetail(detail.id);
    setMembers((list) =>
      list.map((m) => (m.id === detail.id ? { ...m, status: detail.status } : m)),
    );
  }

  function quickBlock(memberId: string, status: "active" | "blocked") {
    setListError(null);
    setPendingId(memberId);
    startTransition(async () => {
      const res = await setCommunityMemberStatusAction(memberId, status);
      setPendingId(null);
      if (!res.ok) {
        setListError(res.error);
        return;
      }
      setMembers((list) =>
        list.map((m) => (m.id === memberId ? { ...m, status } : m)),
      );
      if (detail?.id === memberId) {
        setDetail({ ...detail, status });
      }
    });
  }

  if (members.length === 0) {
    return (
      <p className="text-zinc-400 text-sm">
        No Mission Hub member profiles yet. Profiles appear when partners join and complete their
        account.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <label className="sm:col-span-2 flex flex-col gap-1 text-[10px] text-zinc-500">
          Search
          <span className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
              placeholder="Name or email"
              className="h-8 w-full rounded-lg border border-zinc-700 bg-zinc-900 pl-8 pr-2 text-xs text-zinc-200"
            />
          </span>
        </label>
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(v) =>
            setFilters((f) => ({ ...f, status: v as MemberPortalFilters["status"] }))
          }
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "blocked", label: "Blocked" },
            { value: "pending", label: "Pending" },
          ]}
        />
        <FilterSelect
          label="Role"
          value={filters.role}
          onChange={(v) =>
            setFilters((f) => ({ ...f, role: v as MemberPortalFilters["role"] }))
          }
          options={[
            { value: "all", label: "All roles" },
            { value: "member", label: "Member" },
            { value: "staff", label: "Staff" },
            { value: "admin", label: "Admin" },
            { value: "visitor", label: "Visitor profile" },
          ]}
        />
        <FilterSelect
          label="Email channel"
          value={filters.emailNotifications}
          onChange={(v) =>
            setFilters((f) => ({
              ...f,
              emailNotifications: v as MemberPortalFilters["emailNotifications"],
            }))
          }
          options={[
            { value: "all", label: "Any" },
            { value: "on", label: "On" },
            { value: "off", label: "Off" },
          ]}
        />
        <FilterSelect
          label="Newsletters"
          value={filters.newsletterNotifications}
          onChange={(v) =>
            setFilters((f) => ({
              ...f,
              newsletterNotifications: v as MemberPortalFilters["newsletterNotifications"],
            }))
          }
          options={[
            { value: "all", label: "Any" },
            { value: "on", label: "On" },
            { value: "off", label: "Off" },
          ]}
        />
        <FilterSelect
          label="Muted space"
          value={filters.mutedSpaceSlug}
          onChange={(v) => setFilters((f) => ({ ...f, mutedSpaceSlug: v }))}
          options={[
            { value: "", label: "Any" },
            ...mutedSpaceOptions.map((slug) => ({ value: slug, label: slug })),
          ]}
        />
      </div>

      <p className="text-xs text-zinc-500">
        Showing {filtered.length} of {members.length} members
      </p>

      {listError ? <p className="text-sm text-red-400">{listError}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-brand-primary/20">
        <table className="w-full text-sm text-left min-w-[960px]">
          <thead className="bg-zinc-800/80 text-zinc-300">
            <tr>
              <th className="px-3 py-2.5 font-medium">Name</th>
              <th className="px-3 py-2.5 font-medium">Email</th>
              <th className="px-3 py-2.5 font-medium">Role</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Joined</th>
              <th className="px-3 py-2.5 font-medium">Last active</th>
              <th className="px-3 py-2.5 font-medium">Notifications</th>
              <th className="px-3 py-2.5 font-medium">Unread</th>
              <th className="px-3 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary/10">
            {filtered.map((m) => {
              const busy = isPending && pendingId === m.id;
              const email = displayEmail(m);
              return (
                <tr
                  key={m.id}
                  className="text-zinc-200 hover:bg-zinc-800/40 cursor-pointer"
                  onClick={() => void openDetail(m.id)}
                >
                  <td className="px-3 py-2.5 font-medium text-brand-accent">
                    {m.displayName?.trim() ||
                      formatMemberDisplayName(m.firstName, m.lastName)}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-400 max-w-[10rem] truncate">
                    {email ?? "—"}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-400">{m.userRoleLabel}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                        m.status === "active" && "bg-emerald-900/50 text-emerald-300",
                        m.status === "blocked" && "bg-red-900/50 text-red-300",
                        m.status === "pending" && "bg-amber-900/50 text-amber-300",
                      )}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap text-xs">
                    {formatDate(m.joinedAt)}
                  </td>
                  <td className="px-3 py-2.5 text-zinc-500 whitespace-nowrap text-xs">
                    {formatDate(m.lastActiveAt)}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-zinc-400 max-w-[14rem]">
                    {formatNotificationPrefsSummary(m)}
                  </td>
                  <td className="px-3 py-2.5 text-center">{m.unreadNotificationCount}</td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[10px]"
                        onClick={() => void openDetail(m.id)}
                      >
                        View
                      </Button>
                      {m.status === "blocked" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          className="h-7 text-[10px]"
                          onClick={() => quickBlock(m.id, "active")}
                        >
                          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Activate"}
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          className="h-7 text-[10px] text-red-300"
                          onClick={() => quickBlock(m.id, "blocked")}
                        >
                          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Block"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>Member details</DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          ) : detailError ? (
            <p className="text-sm text-red-400">{detailError}</p>
          ) : detail ? (
            <MemberDetailPanel
              member={detail}
              onClose={() => setDetailOpen(false)}
              onRefresh={refreshDetail}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setCommunityMemberStatusAction } from "@/app/admin/community/member-actions";
import type { AdminCommunityMemberRow } from "@/lib/community/members";
import { formatMemberDisplayName } from "@/lib/community/members";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AdminCommunityMembersManager({
  initialMembers,
}: {
  initialMembers: AdminCommunityMemberRow[];
}) {
  const [members, setMembers] = useState(initialMembers);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateStatus(memberId: string, status: "active" | "blocked") {
    setError(null);
    setPendingId(memberId);
    startTransition(async () => {
      const res = await setCommunityMemberStatusAction(memberId, status);
      setPendingId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMembers((list) =>
        list.map((m) => (m.id === memberId ? { ...m, status } : m)),
      );
    });
  }

  if (members.length === 0) {
    return (
      <p className="text-zinc-400 text-sm">No member profiles yet. They appear when visitors comment.</p>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-red-400 text-sm">{error}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-brand-primary/20">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-800/80 text-zinc-300">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Account email</th>
              <th className="px-4 py-3 font-medium">Profile email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Comments</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-primary/10">
            {members.map((m) => {
              const busy = isPending && pendingId === m.id;
              return (
                <tr key={m.id} className="text-zinc-200 hover:bg-zinc-800/40">
                  <td className="px-4 py-3 font-medium text-brand-accent">
                    {formatMemberDisplayName(m.firstName, m.lastName)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{m.userEmail ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{m.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                        m.status === "active" && "bg-emerald-900/50 text-emerald-300",
                        m.status === "blocked" && "bg-red-900/50 text-red-300",
                        m.status === "pending" && "bg-amber-900/50 text-amber-300",
                      )}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{m.commentCount}</td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                    {formatDate(m.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    {m.status === "blocked" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => updateStatus(m.id, "active")}
                        className="border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/30"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unblock"}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy || m.status !== "active"}
                        onClick={() => updateStatus(m.id, "blocked")}
                        className="border-red-600/50 text-red-300 hover:bg-red-900/30"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Block"}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
